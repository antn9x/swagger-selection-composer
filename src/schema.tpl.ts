import upperFirst from 'lodash/upperFirst';

const methodMap = {
  get: 'Get',
  post: 'Create new',
  put: 'Update',
  delete: 'Delete'
};

export type Method = 'get' | 'post' | 'put' | 'delete';

export function createApiMethod(method: Method, module: string, router: string) {
  return {
    tags: [upperFirst(module)],
    summary: `${methodMap[method]} ${module}`,
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
        description: `${methodMap[method]} ${module} success`,
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
