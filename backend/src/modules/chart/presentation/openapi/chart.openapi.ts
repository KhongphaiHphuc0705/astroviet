import { registry } from '../../../../docs/openapi.js';
import { paginatedResponseSchema } from '../../../../shared/http/paginated-response.mapper.js';
import { problemDetailsSchema } from '../../../../shared/http/problem-details.js';
import { chartResponseSchema } from '../mappers/chart-response.mapper.js';
import { chartSummaryResponseSchema } from '../mappers/chart-summary-response.mapper.js';
import { chartIdSchema } from '../schemas/chart-id.schema.js';
import { createNatalChartQuerySchema } from '../schemas/create-natal-chart-query.schema.js';
import { createNatalChartSchema } from '../schemas/create-natal-chart.schema.js';
import { listChartsQuerySchema } from '../schemas/list-charts-query.schema.js';

const tags = ['Chart'];

// POST /api/v1/charts/natal
registry.registerPath({
  method: 'post',
  path: '/api/v1/charts/natal',
  tags,
  security: [{ bearerAuth: [] }, {}],
  summary: 'Create a natal chart',
  description:
    'Calculate a natal chart. If the user is a Guest (unauthenticated), the chart will not be saved (save=false is required). For authenticated users, save defaults to true.',
  request: {
    query: createNatalChartQuerySchema,
    body: {
      content: {
        'application/json': {
          schema: createNatalChartSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'The calculated chart (not saved).',
      content: {
        'application/json': {
          schema: chartResponseSchema,
        },
      },
    },
    201: {
      description: 'The created and saved chart.',
      content: {
        'application/json': {
          schema: chartResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    422: {
      description: 'Unprocessable Entity',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// GET /api/v1/charts
registry.registerPath({
  method: 'get',
  path: '/api/v1/charts',
  tags,
  security: [{ bearerAuth: [] }],
  summary: 'List charts',
  description: 'Retrieve a paginated list of charts for the authenticated user.',
  request: {
    query: listChartsQuerySchema,
  },
  responses: {
    200: {
      description: 'A paginated list of chart summaries.',
      content: {
        'application/json': {
          schema: paginatedResponseSchema(chartSummaryResponseSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// GET /api/v1/charts/{id}
registry.registerPath({
  method: 'get',
  path: '/api/v1/charts/{id}',
  tags,
  security: [{ bearerAuth: [] }],
  summary: 'Get a chart by ID',
  description: 'Retrieve a specific chart by its ID.',
  request: {
    params: chartIdSchema,
  },
  responses: {
    200: {
      description: 'The requested chart.',
      content: {
        'application/json': {
          schema: chartResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});

// DELETE /api/v1/charts/{id}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/charts/{id}',
  tags,
  security: [{ bearerAuth: [] }],
  summary: 'Delete a chart',
  description: 'Soft delete a specific chart.',
  request: {
    params: chartIdSchema,
  },
  responses: {
    204: {
      description: 'Successfully deleted.',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: problemDetailsSchema } },
    },
  },
});
