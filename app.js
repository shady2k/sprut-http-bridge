'use strict';

const fastify = require('fastify');

function build(opts = {}) {
  const app = fastify(opts);

  // Register the dotenv as early as possible
  const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
  require("dotenv").config({ path: envFileName });

  // Register plugins here
  app.register(require("@fastify/swagger"));

  app.register(require("@fastify/swagger-ui"), {
    routePrefix: "/",
    uiConfig: {
      docExpansion: "full",
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
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  });

  // Sprut Initialization
  const Sprut = require("./sprut.js");
  const sprut = new Sprut({
    wsUrl: process.env.WS_URL,
    sprutLogin: process.env.SPRUT_LOGIN,
    sprutPassword: process.env.SPRUT_PASSWORD,
    serial: process.env.SPRUT_SERIAL,
    logger: app.log,
  });

  // JSON Schema for the request body
  const updateSchema = {
    description: "Update an accessory",
    tags: ["accessory"],
    summary: "Updates the specified accessory",
    body: {
      type: "object",
      properties: {
        accessoryId: { type: "number" },
        serviceId: { type: "number" },
        characteristicId: { type: "number" },
        value: { type: "boolean" },
      },
      required: ["accessoryId", "serviceId", "characteristicId", "value"],
    },
    response: {
      200: {
        description: "Successful response",
        type: "object",
        properties: {
          accessoryId: { type: "number" },
          serviceId: { type: "number" },
          characteristicId: { type: "number" },
          value: { type: "boolean" },
          result: {
            type: "object",
            properties: {
              isSuccess: { type: "boolean" },
              code: { type: "number" },
              message: { type: "string" },
            },
            required: ["isSuccess", "code", "message"],
          },
        },
        required: [
          "accessoryId",
          "serviceId",
          "characteristicId",
          "value",
          "result",
        ],
      },
    },
  };

  // Route definitions
  app.post("/update", { schema: updateSchema }, async (request, reply) => {
    try {
      const result = await sprut.execute("update", request.body);
      return {
        ...request.body,
        result,
      };
    } catch (error) {
      app.log.error(error);
      reply
        .code(500)
        .send({ error: "An error occurred while processing your request." });
    }
  });

  // Close hook
  app.addHook("onClose", async () => {
    await sprut.close();
  });

  return app;
}

module.exports = build;