const fastify = require("fastify")({
  logger: true,
});
const envFileName = `.env.${process.env.NODE_ENV || "development"}`
require ("dotenv").config({ path: envFileName });
const Sprut = require("./sprut.js");

const sprut = new Sprut({
  wsUrl: process.env.WS_URL,
  sprutLogin: process.env.SPRUT_LOGIN,
  sprutPassword: process.env.SPRUT_PASSWORD,
  serial: process.env.SPRUT_SERIAL,
  logger: fastify.log
});

fastify.post("/update", async (request, reply) => {
  // Access Sprut instance from the Fastify instance
  const result = await sprut.execute(
    "update",
    request.body
  );
  return result;
});

fastify.addHook("onClose", async () => {
  await sprut.close();
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
  fastify.log.info(`Server listening on ${address}`);
});
