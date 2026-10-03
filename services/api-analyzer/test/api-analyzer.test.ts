import { describe, it, expect } from 'vitest';
import { ApiSchemaParser } from '../src/index.js';

describe('ApiSchemaParser & API Intelligence', () => {
  it('parses OpenAPI v3 definition and extracts operations and parameters', () => {
    const mockOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Order Service API', version: '1.0.0' },
      paths: {
        '/api/v1/orders': {
          get: {
            summary: 'List orders',
            parameters: [
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
              { name: 'status', in: 'query', required: false, schema: { type: 'string' } }
            ]
          },
          post: {
            summary: 'Create order',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            security: [{ BearerAuth: [] }]
          }
        }
      }
    };

    const ops = ApiSchemaParser.parseOpenApi(mockOpenApiDoc, 'http://api.target.local');
    expect(ops.length).toBe(2);

    const getOp = ops.find(o => o.method === 'GET');
    expect(getOp?.endpointId).toBe('GET:api.target.local:/api/v1/orders');
    expect(getOp?.parameters.length).toBe(2);
    expect(getOp?.authRequired).toBe(false);

    const postOp = ops.find(o => o.method === 'POST');
    expect(postOp?.endpointId).toBe('POST:api.target.local:/api/v1/orders');
    expect(postOp?.authRequired).toBe(true);
  });

  it('generates GraphQL standard introspection operations', () => {
    const ops = ApiSchemaParser.parseGraphQL('http://api.target.local/graphql');
    expect(ops.length).toBe(1);
    expect(ops[0].endpointId).toBe('POST:api.target.local:/graphql');
    expect(ops[0].parameters.some(p => p.name === 'query')).toBe(true);
  });
});
