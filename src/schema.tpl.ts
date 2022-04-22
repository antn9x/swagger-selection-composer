import upperFirst from 'lodash/upperFirst';
import { getNameByRouter } from './stringUtils';

const methodMap = {
  get: 'Get',
  post: 'Create new',
  put: 'Update',
  delete: 'Delete'
};

export type Method = 'get' | 'post' | 'put' | 'delete';

function getSummary(method: Method, module: string, router: string) {
  return `${methodMap[method]} ${router.split('/').length >= 3 ?
    getNameByRouter(router) : module}`;
}

export function createApiMethod(method: Method, module: string, router: string) {
  return {
    tags: [upperFirst(module)],
    summary: getSummary(method, module, router),
    security: [{ bearerAuth: [] }],
    parameters: [{
      in: 'path',
      name: 'id',
      required: true,
      schema: {
        type: 'string',
        example: '6197144c893ed4d8d611ed8d'
      },
    }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object', properties: { id: { type: 'string' } } }
        }
      }
    },
    responses: {
      '200': {
        description: `${getSummary(method, module, router)} success`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string'
                }
              },
              required: ['_id']
            }
          }
        }
      }
    }
  };
}

export function createDefaultSchema() {
  return {
    type: 'object',
    properties: {
      _id: {
        type: 'string'
      }
    },
    required: ['_id']
  };
}
