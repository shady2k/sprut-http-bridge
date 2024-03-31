"use strict";

const fastify = require("fastify");
const updateSchema = require("./schemas/update");
const versionSchema = require("./schemas/version");

async function build(opts = {}) {
  const app = fastify(opts);

  // Register the dotenv as early as possible
  const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
  require("dotenv").config({ path: envFileName });

  // Register plugins here
  await app.register(require("@fastify/swagger"));

  await app.register(require("@fastify/swagger-ui"), {
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

  if(process.env.NODE_ENV === "test") {
    app.decorate("sprut", sprut);
  }

  // Route definitions
  app.post("/update", updateSchema, async (request, reply) => {
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

  app.get("/version", versionSchema, async (request, reply) => {
    try {
      const result = await sprut.version();
      return {
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
