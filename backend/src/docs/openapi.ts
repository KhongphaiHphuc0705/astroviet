import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AstroViet API',
      version: '0.1.0',
      description: 'AstroViet API Documentation',
    },
    servers: [
      {
        url: '{baseUrl}',
        description: 'Server URL',
        variables: {
          baseUrl: {
            default: 'http://localhost:3000',
            description: 'API base URL',
          },
        },
      },
    ],
  });
}
