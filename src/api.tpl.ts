import cloneDeep from 'lodash/cloneDeep';

export const apiTemplateObject = (title: string, description: string, port = 3016) => ({
  openapi: '3.0.0',
  info: {
    title,
    description,
    version: 'v1'
  },
  servers: [{
    url: `http://localhost:${port}/v1/`,
    description: 'local'
  }],
  tags: [{
    name: 'Authentication',
    description: 'auth'
  }],
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
  },
  paths: {}
});
