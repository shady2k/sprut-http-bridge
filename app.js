"use strict";

const fastify = require("fastify");
const Schema = require('/Users/shady/Documents/repos/spruthub-client/src/schemas/index.js');

async function build(opts = {}) {
  const app = fastify(opts);

  // Register the dotenv as early as possible
  const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
  require("dotenv").config({ path: envFileName, override: true });

  // Register plugins here
  await app.register(require("@fastify/swagger"), {
    swagger: {
      info: {
        title: 'Sprut.hub HTTP Bridge',
        description: 'A RESTful HTTP to WebSocket bridge for interacting with Sprut services',
        version: '1.0.4'
      },
      definitions: Schema.schema.definitions,
    }
  });

  await app.register(require("@fastify/swagger-ui"), {
    routePrefix: "/",
    uiConfig: {
      docExpansion: "none",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: false,
    transformStaticCSP: (header) => header.replace(/https:/g, 'http:'),
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  });

  // Completely dynamic handler - works with any method from schema
  function createGenericHandler(methodName) {
    return async (request, reply) => {
      try {
        // Build parameters based on HTTP request
        const params = {
          ...request.body,
          ...request.params,
          ...request.query
        };

        // Call the method dynamically
        const response = await sprut.callMethod(methodName, params);

        app.log.debug(response, `Sprut-client call for ${methodName} returned`);

        if (response && response.isSuccess) {
          reply.header('Content-Type', 'application/json');
          reply.send(JSON.stringify({ result: response.data }));
        } else {
          const errorMsg = response?.message || 'An error occurred in sprut-client';
          app.log.error(response, `Sprut-client call for ${methodName} failed`);
          reply.code(500).send({ error: errorMsg });
        }

      } catch (error) {
        app.log.error(error, `Error in handler for ${methodName}`);
        reply.code(500).send({ error: "An error occurred while processing your request." });
      }
    };
  }

  // Sprut Initialization
  const Sprut = require("./sprut.js");
  const sprut = new Sprut({
    wsUrl: process.env.WS_URL,
    sprutEmail: process.env.SPRUT_EMAIL,
    sprutPassword: process.env.SPRUT_PASSWORD,
    serial: process.env.SPRUT_SERIAL,
    logger: app.log,
  });

  if(process.env.NODE_ENV === "test") {
    app.decorate("sprut", sprut);
  }

  // Completely dynamic route generation from schema
  const restMethods = Schema.getRestMethods();
  
  restMethods.forEach(restMethod => {
    const { methodName, httpMethod, path, schema: methodSchema } = restMethod;
    
    // Create Fastify schema from SprutHub schema
    const fastifySchema = {
      description: methodSchema.description,
      tags: [methodSchema.category || 'sprut'],
      summary: methodSchema.description,
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            result: methodSchema.result
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    };

    // Include definitions if the schema has $ref references
    if (JSON.stringify(methodSchema).includes('$ref')) {
      fastifySchema.response['200'].definitions = Schema.schema.definitions;
    }

    // Add path parameters if the path contains parameters
    if (path.includes(':')) {
      const pathParts = path.split('/');
      const params = pathParts.filter(part => part.startsWith(':')).map(part => part.substring(1));
      if (params.length > 0) {
        fastifySchema.params = {
          type: 'object',
          properties: {},
          required: []
        };
        params.forEach(param => {
          fastifySchema.params.properties[param] = {
            type: 'string',
            description: `${param} parameter`
          };
          fastifySchema.params.required.push(param);
        });
      }
    }


    // Add body validation for POST/PUT/PATCH methods
    if (['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase()) && methodSchema.params) {
      fastifySchema.body = methodSchema.params;
      
      // Include definitions for body if schema has $ref references
      if (JSON.stringify(methodSchema.params).includes('$ref')) {
        if (!fastifySchema.body.definitions) {
          fastifySchema.body.definitions = Schema.schema.definitions;
        }
      }
    }

    // Register the route with generic handler
    const handler = createGenericHandler(methodName);
    app[httpMethod.toLowerCase()](path, { schema: fastifySchema }, handler);
    app.log.info(`Registered ${httpMethod} ${path} -> ${methodName}`);
  });

  // Close hook
  app.addHook("onClose", async () => {
    await sprut.close();
  });

  return app;
}

module.exports = build;