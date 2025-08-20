"use strict";

const fastify = require("fastify");
const updateSchema = require("./schemas/update");
const versionSchema = require("./schemas/version");
const hubsSchema = require("./schemas/hubs");
const accessoriesSchema = require("./schemas/accessories");
const roomsSchema = require("./schemas/rooms");
const systemInfoSchema = require("./schemas/systemInfo");

async function build(opts = {}) {
  const app = fastify(opts);

  // Register the dotenv as early as possible
  const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
  require("dotenv").config({ path: envFileName, override: true });

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
    staticCSP: false,
    transformStaticCSP: (header) => header.replace(/https:/g, 'http:'),
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  });

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

  app.get("/hubs", hubsSchema, async (request, reply) => {
    try {
      const result = await sprut.listHubs();
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

  app.get("/accessories", accessoriesSchema, async (request, reply) => {
    try {
      const expand = request.query?.expand || "services,characteristics";
      const result = await sprut.listAccessories(expand);
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

  app.get("/rooms", roomsSchema, async (request, reply) => {
    try {
      const result = await sprut.listRooms();
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

  app.get("/system-info", systemInfoSchema, async (request, reply) => {
    try {
      const result = await sprut.getFullSystemInfo();
      return result;
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
