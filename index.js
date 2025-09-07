"use strict";

// Importing necessary modules
const build = require("./app");

// Load environment variables
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// Logger configuration based on environment
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
  production: {
    level: "info",
  },
  test: false, // Assuming you might not need logging for tests, adjust as necessary
};

// Server options including logger configuration
const opts = {
  logger: envToLogger[process.env.NODE_ENV] ?? true, // Fallback to true if no matching environment is found
};

// Building the Fastify application with the specified options
(async () => {
  try {
    const server = await build(opts); // Await the build function here
    await server.ready(); // Wait for all plugins to be loaded
    server.listen(
      {
        host: process.env.LISTENING_HOST || "localhost",
        port: process.env.LISTENING_PORT || 3000,
      },
      (err, address) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log(`Server listening at ${address}`);
      }
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
