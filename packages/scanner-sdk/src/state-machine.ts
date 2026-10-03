export type ScanPhase =
  | 'CREATED'
  | 'SCOPE_VALIDATION'
  | 'RECON'
  | 'CRAWLING'
  | 'BROWSER_DISCOVERY'
  | 'ATTACK_SURFACE_BUILD'
  | 'PASSIVE_ANALYSIS'
  | 'ACTIVE_ANALYSIS'
  | 'VERIFICATION'
  | 'CORRELATION'
  | 'EVIDENCE_FINALIZATION'
  | 'REPORTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'TIMEOUT';

export interface ScanStateTransition {
  from: ScanPhase;
  to: ScanPhase;
  timestamp: string;
  reason?: string;
}

export class ScanStateMachine {
  private currentPhase: ScanPhase = 'CREATED';
  private history: ScanStateTransition[] = [];

  private static readonly VALID_TRANSITIONS: Record<ScanPhase, ScanPhase[]> = {
    CREATED: ['SCOPE_VALIDATION', 'CANCELLED', 'FAILED'],
    SCOPE_VALIDATION: ['RECON', 'CANCELLED', 'FAILED'],
    RECON: ['CRAWLING', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    CRAWLING: ['BROWSER_DISCOVERY', 'ATTACK_SURFACE_BUILD', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    BROWSER_DISCOVERY: ['ATTACK_SURFACE_BUILD', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    ATTACK_SURFACE_BUILD: ['PASSIVE_ANALYSIS', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    PASSIVE_ANALYSIS: ['ACTIVE_ANALYSIS', 'CORRELATION', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    ACTIVE_ANALYSIS: ['VERIFICATION', 'CORRELATION', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    VERIFICATION: ['CORRELATION', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    CORRELATION: ['EVIDENCE_FINALIZATION', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    EVIDENCE_FINALIZATION: ['REPORTING', 'CANCELLED', 'FAILED', 'TIMEOUT'],
    REPORTING: ['COMPLETED', 'CANCELLED', 'FAILED'],
    COMPLETED: [],
    CANCELLED: [],
    FAILED: [],
    TIMEOUT: []
  };

  constructor(initialPhase: ScanPhase = 'CREATED') {
    this.currentPhase = initialPhase;
    this.history.push({ from: 'CREATED', to: initialPhase, timestamp: new Date().toISOString(), reason: 'Initial state' });
  }

  public getPhase(): ScanPhase {
    return this.currentPhase;
  }

  public getHistory(): ScanStateTransition[] {
    return [...this.history];
  }

  public transition(targetPhase: ScanPhase, reason?: string): boolean {
    const allowed = ScanStateMachine.VALID_TRANSITIONS[this.currentPhase];
    if (!allowed || !allowed.includes(targetPhase)) {
      throw new Error(`Invalid scan state transition from ${this.currentPhase} to ${targetPhase}`);
    }

    const previous = this.currentPhase;
    this.currentPhase = targetPhase;
    this.history.push({
      from: previous,
      to: targetPhase,
      timestamp: new Date().toISOString(),
      reason
    });
    return true;
  }

  public isTerminal(): boolean {
    return ['COMPLETED', 'CANCELLED', 'FAILED', 'TIMEOUT'].includes(this.currentPhase);
  }
}
