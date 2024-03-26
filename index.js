const envToLogger = {
  development: {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const fastify = require("fastify")({
  logger: envToLogger[process.env.NODE_ENV] ?? true, // defaults to true if no entry matches in the map
});
const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
require("dotenv").config({ path: envFileName });

(async () => {
  await fastify.register(require("@fastify/swagger"));

  await fastify.register(require("@fastify/swagger-ui"), {
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
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  const Sprut = require("./sprut.js");
  const sprut = new Sprut({
    wsUrl: process.env.WS_URL,
    sprutLogin: process.env.SPRUT_LOGIN,
    sprutPassword: process.env.SPRUT_PASSWORD,
    serial: process.env.SPRUT_SERIAL,
    logger: fastify.log,
  });

  // Define the JSON Schema for the request body
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

  fastify.post("/update", { schema: updateSchema }, async (request, reply) => {
    try {
      const result = await sprut.execute("update", request.body);
      return {
        ...request.body,
        result,
      };
    } catch (error) {
      fastify.log.error(error);
      reply
        .code(500)
        .send({ error: "An error occurred while processing your request." });
    }
  });

  fastify.addHook("onClose", async () => {
    await sprut.close();
  });

  // Ensure all plugins are fully initialized before listening
  await fastify.ready();

  // Start the server
  fastify.listen(
    {
      host: process.env.LISTENING_HOST || "localhost",
      port: process.env.LISTENING_PORT || 3000,
    },
    function (err, address) {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      // Server is now listening on ${address}
      fastify.log.info(`Server listening on ${address}`);
    }
  );
})();
