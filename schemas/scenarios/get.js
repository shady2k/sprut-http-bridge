'use strict'

module.exports = {
  tags: ['scenarios'],
  description: 'Get a scenario by id',
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Scenario id'
      }
    }
  },
  query: {
    type: 'object',
    properties: {
      expand: {
        type: 'string',
        description: 'Expand data',
        default: 'data'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        result: {
          type: 'object',
          properties: {
            scenario: {
              type: 'object',
              properties: {
                get: {
                  type: 'object',
                  properties: {
                    order: { type: 'number' },
                    type: { type: 'string' },
                    predefined: { type: 'boolean' },
                    active: { type: 'boolean' },
                    onStart: { type: 'boolean' },
                    sync: { type: 'boolean' },
                    error: { type: 'boolean' },
                    index: { type: 'string' },
                    name: { type: 'string' },
                    desc: { type: 'string' },
                    data: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
