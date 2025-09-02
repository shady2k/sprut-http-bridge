"use strict";

const fastify = require("fastify");
const { Schema } = require('spruthub-client');

function findLeafProperties(schema) {
  const leaves = {};
  function recurse(obj) {
    if (obj && obj.properties) {
      for (const key in obj.properties) {
        const prop = obj.properties[key];
        if (prop.properties) {
          Object.assign(leaves, recurse(prop));
        } else {
          leaves[key] = prop;
        }
      }
    }
    return leaves;
  }
  return recurse(schema);
}

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
        version: require('./package.json').version
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
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: false,
    transformStaticCSP: (header) => header.replace(/https:/g, 'http:'),
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  });

  function constructNestedParams(flatParams, schema) {
    // Discover the single-key nesting path (e.g., room -> get -> id)
    const path = [];
    let current = schema;
    while (current && current.properties && Object.keys(current.properties).length === 1) {
      const key = Object.keys(current.properties)[0];
      path.push(key);
      current = current.properties[key];
    }

    if (path.length === 0) {
      return flatParams;
    }

    // Build the nested envelope according to discovered path
    const result = {};
    let nested = result;
    for (let i = 0; i < path.length - 1; i++) {
      nested = nested[path[i]] = {};
    }

    const lastKey = path[path.length - 1];

    // If the leaf schema is a primitive (no properties), avoid wrapping { id: { id: value } }
    // and place the primitive directly. Also coerce number/integer types accordingly.
    const isPrimitiveLeaf = !current || !current.properties;
    if (isPrimitiveLeaf) {
      let value = flatParams[lastKey];
      if (value !== undefined && value !== null) {
        const t = current && current.type;
        if ((t === 'number' || t === 'integer') && typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)) {
          value = t === 'integer' ? parseInt(value, 10) : parseFloat(value);
        } else if (t === 'boolean' && typeof value === 'string') {
          if (value.toLowerCase() === 'true') value = true;
          else if (value.toLowerCase() === 'false') value = false;
        }
      }
      nested[lastKey] = value;
    } else {
      // Otherwise, attach the collected flat params as the object under the last key
      nested[lastKey] = flatParams;
    }

    return result;
  }

  // Completely dynamic handler - works with any method from schema
  function createGenericHandler(methodName, methodSchema) {
    return async (request, reply) => {
      try {
        // Build parameters based on HTTP request
        let params = {
          ...request.body,
          ...request.params,
          ...request.query
        };

        if (request.method.toUpperCase() === 'GET' && methodSchema && methodSchema.params) {
          const allParams = { ...request.params, ...request.query };
          params = constructNestedParams(allParams, methodSchema.params);
        }

        app.log.debug({ params }, `Calling sprut.callMethod with params for ${methodName}`);

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


    // Add query string validation for GET methods
    if (httpMethod.toUpperCase() === 'GET' && methodSchema.params) {
      const pathParams = fastifySchema.params ? Object.keys(fastifySchema.params.properties) : [];
      const allQuerystring = findLeafProperties(methodSchema.params);
      const querystring = {};
      for (const key in allQuerystring) {
        if (!pathParams.includes(key)) {
          querystring[key] = allQuerystring[key];
        }
      }

      if (Object.keys(querystring).length > 0) {
        fastifySchema.querystring = {
          type: 'object',
          properties: querystring
        };
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
    const handler = createGenericHandler(methodName, methodSchema);
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
