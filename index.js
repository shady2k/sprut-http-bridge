const envToLogger = {
  development: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
}

const fastify = require('fastify')({
  logger: envToLogger[process.env.NODE_ENV] ?? true // defaults to true if no entry matches in the map
})
const envFileName = `.env.${process.env.NODE_ENV || "development"}`;
require("dotenv").config({ path: envFileName });
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
};

fastify.post("/update", { schema: updateSchema }, async (request, reply) => {
  try {
    const result = await sprut.execute("update", request.body);
    return {
      ...request.body,
      result
    }
 } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'An error occurred while processing your request.' });
 }
});

fastify.addHook("onClose", async () => {
  await sprut.close();
});

// Run the server!
fastify.listen({ port: process.env.LISTENING_PORT || 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
  fastify.log.info(`Server listening on ${address}`);
});
