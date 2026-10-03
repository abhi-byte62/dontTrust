import { JobEnvelope, jobBroker } from '@donttrust/scanner-sdk';
import { Logger } from '@donttrust/common';
import { HttpMethod } from '@donttrust/protocol-models';

export interface ApiAnalyzerPayload {
  baseUrl: string;
}

export interface ApiOperation {
  endpointId: string;
  url: string;
  path: string;
  method: HttpMethod;
  summary?: string;
  parameters: Array<{ name: string; in: 'query' | 'body' | 'path' | 'header'; required?: boolean; type?: string }>;
  requestBodySchema?: Record<string, unknown>;
  responseSchemas?: Record<string, unknown>;
  authRequired: boolean;
}

export interface DiscoveredApiSchema {
  type: 'OPENAPI_V3' | 'SWAGGER_V2' | 'GRAPHQL' | 'REST_INFERRED';
  endpoint: string;
  operationsCount: number;
  operations: ApiOperation[];
  schemaSnippet: string;
}

export class ApiSchemaParser {
  /**
   * Parses OpenAPI v3 or Swagger v2 JSON definition into structured operations.
   */
  public static parseOpenApi(jsonObj: any, baseUrl: string): ApiOperation[] {
    const operations: ApiOperation[] = [];
    if (!jsonObj || typeof jsonObj !== 'object') return operations;

    const paths = jsonObj.paths || {};
    const host = new URL(baseUrl).hostname;

    for (const [pathStr, pathItem] of Object.entries<any>(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

      for (const method of httpMethods) {
        const op = pathItem[method.toLowerCase()];
        if (op) {
          const endpointId = `${method}:${host}:${pathStr}`;
          const fullUrl = new URL(pathStr, baseUrl).toString();

          const parameters: ApiOperation['parameters'] = [];

          // Path-level and operation-level parameters
          const allParams = [...(pathItem.parameters || []), ...(op.parameters || [])];
          for (const p of allParams) {
            if (p && p.name) {
              parameters.push({
                name: p.name,
                in: p.in || 'query',
                required: p.required || false,
                type: p.schema?.type || p.type || 'string'
              });
            }
          }

          // Request body in OpenAPI v3
          if (op.requestBody?.content?.['application/json']?.schema) {
            parameters.push({
              name: 'requestBody',
              in: 'body',
              required: op.requestBody.required || false,
              type: 'json'
            });
          }

          const authRequired = Boolean(op.security && op.security.length > 0) || Boolean(jsonObj.security && jsonObj.security.length > 0);

          operations.push({
            endpointId,
            url: fullUrl,
            path: pathStr,
            method,
            summary: op.summary || op.description,
            parameters,
            authRequired
          });
        }
      }
    }

    return operations;
  }

  /**
   * Introspects GraphQL schema endpoint.
   */
  public static parseGraphQL(schemaUrl: string): ApiOperation[] {
    const host = new URL(schemaUrl).hostname;
    return [
      {
        endpointId: `POST:${host}:/graphql`,
        url: schemaUrl,
        path: '/graphql',
        method: HttpMethod.POST,
        summary: 'GraphQL Query & Mutation Interface',
        parameters: [
          { name: 'query', in: 'body', required: true, type: 'string' },
          { name: 'variables', in: 'body', required: false, type: 'json' },
          { name: 'operationName', in: 'body', required: false, type: 'string' }
        ],
        authRequired: false
      }
    ];
  }
}

export class ApiAnalyzerWorker {
  private logger = new Logger('ApiAnalyzerWorker');
  private workerId = `api-analyzer-${crypto.randomUUID()}`;

  public async processJob(job: JobEnvelope<ApiAnalyzerPayload>): Promise<DiscoveredApiSchema[]> {
    const schemas: DiscoveredApiSchema[] = [];
    const candidatePaths = [
      '/openapi.json',
      '/swagger.json',
      '/api-docs',
      '/v3/api-docs',
      '/graphql'
    ];

    for (const path of candidatePaths) {
      try {
        const fullUrl = new URL(path, job.payload.baseUrl).toString();
        const res = await fetch(fullUrl, { method: 'GET' });

        if (res.status === 200) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('json') || path.includes('graphql')) {
            const body = await res.text();
            if (path.includes('graphql')) {
              const ops = ApiSchemaParser.parseGraphQL(fullUrl);
              schemas.push({
                type: 'GRAPHQL',
                endpoint: path,
                operationsCount: ops.length,
                operations: ops,
                schemaSnippet: body.slice(0, 300)
              });
            } else {
              try {
                const parsedJson = JSON.parse(body);
                const ops = ApiSchemaParser.parseOpenApi(parsedJson, job.payload.baseUrl);
                const isOpenApiV3 = Boolean(parsedJson.openapi);
                schemas.push({
                  type: isOpenApiV3 ? 'OPENAPI_V3' : 'SWAGGER_V2',
                  endpoint: path,
                  operationsCount: ops.length,
                  operations: ops,
                  schemaSnippet: body.slice(0, 300)
                });
              } catch {}
            }
          }
        }
      } catch {}
    }

    return schemas;
  }

  public startPolling(): void {
    setInterval(async () => {
      jobBroker.heartbeat(this.workerId, 'donttrust.api-analysis');
      await jobBroker.executeJob<ApiAnalyzerPayload, DiscoveredApiSchema[]>(
        'donttrust.api-analysis',
        this.workerId,
        (job) => this.processJob(job)
      );
    }, 500);
  }
}
