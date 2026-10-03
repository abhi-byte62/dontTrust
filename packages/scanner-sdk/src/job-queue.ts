import { Logger } from '@donttrust/common';

export type JobPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_NORMAL' | 'P3_LOW' | 'P4_BACKGROUND';

export type QueueName =
  | 'donttrust.recon'
  | 'donttrust.crawl'
  | 'donttrust.browser'
  | 'donttrust.http-analysis'
  | 'donttrust.js-analysis'
  | 'donttrust.api-analysis'
  | 'donttrust.auth-analysis'
  | 'donttrust.verification'
  | 'donttrust.correlation'
  | 'donttrust.reporting';

export interface JobEnvelope<T = Record<string, unknown>> {
  jobId: string;
  scanId: string;
  projectId: string;
  targetId: string;
  scopeId?: string;
  jobType: string;
  priority: JobPriority;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
  deadline: string;
  payload: T;
  idempotencyKey?: string;
}

export type JobHandler<T = any, R = any> = (job: JobEnvelope<T>) => Promise<R>;

export class JobBroker {
  private queues: Map<QueueName, JobEnvelope[]> = new Map();
  private deadLetterQueue: JobEnvelope[] = [];
  private processedKeys: Set<string> = new Set();
  private activeWorkers: Map<string, { workerId: string; queue: QueueName; lastHeartbeat: number }> = new Map();
  private logger = new Logger('JobBroker');

  constructor() {
    this.initQueues();
  }

  private initQueues(): void {
    const queueNames: QueueName[] = [
      'donttrust.recon',
      'donttrust.crawl',
      'donttrust.browser',
      'donttrust.http-analysis',
      'donttrust.js-analysis',
      'donttrust.api-analysis',
      'donttrust.auth-analysis',
      'donttrust.verification',
      'donttrust.correlation',
      'donttrust.reporting'
    ];
    for (const q of queueNames) {
      this.queues.set(q, []);
    }
  }

  private getPriorityWeight(p: JobPriority): number {
    switch (p) {
      case 'P0_CRITICAL': return 0;
      case 'P1_HIGH': return 1;
      case 'P2_NORMAL': return 2;
      case 'P3_LOW': return 3;
      case 'P4_BACKGROUND': return 4;
    }
  }

  public publish<T>(queue: QueueName, job: JobEnvelope<T>): boolean {
    if (job.idempotencyKey && this.processedKeys.has(job.idempotencyKey)) {
      this.logger.debug(`Skipping duplicate job with key ${job.idempotencyKey}`);
      return false;
    }

    const q = this.queues.get(queue);
    if (!q) throw new Error(`Queue ${queue} not registered`);

    q.push(job as any);
    // Sort queue by priority
    q.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
    return true;
  }

  public consumeNext<T>(queue: QueueName): JobEnvelope<T> | null {
    const q = this.queues.get(queue);
    if (!q || q.length === 0) return null;
    return q.shift() as any as JobEnvelope<T>;
  }

  public async executeJob<T, R>(
    queue: QueueName,
    workerId: string,
    handler: JobHandler<T, R>
  ): Promise<R | null> {
    const job = this.consumeNext<T>(queue);
    if (!job) return null;

    this.activeWorkers.set(workerId, { workerId, queue, lastHeartbeat: Date.now() });

    try {
      if (new Date(job.deadline).getTime() < Date.now()) {
        throw new Error(`Job ${job.jobId} exceeded execution deadline.`);
      }

      const result = await handler(job);
      if (job.idempotencyKey) {
        this.processedKeys.add(job.idempotencyKey);
      }
      return result;
    } catch (err: any) {
      this.logger.error(`Job ${job.jobId} failed on attempt ${job.attempt}: ${err.message}`);
      if (job.attempt < job.maxAttempts) {
        job.attempt += 1;
        this.publish(queue, job);
      } else {
        this.logger.error(`Job ${job.jobId} exhausted max attempts. Routing to Dead-Letter Queue.`);
        this.deadLetterQueue.push(job as any);
      }
      throw err;
    }
  }

  public getQueueDepth(queue: QueueName): number {
    return this.queues.get(queue)?.length || 0;
  }

  public getDlqCount(): number {
    return this.deadLetterQueue.length;
  }

  public heartbeat(workerId: string, queue: QueueName): void {
    this.activeWorkers.set(workerId, { workerId, queue, lastHeartbeat: Date.now() });
  }

  public getActiveWorkersCount(): number {
    const cutoff = Date.now() - 30000; // 30s liveness window
    return Array.from(this.activeWorkers.values()).filter(w => w.lastHeartbeat > cutoff).length;
  }
}

export const jobBroker = new JobBroker();
