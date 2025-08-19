module.exports = {
  schema: {
    description: "Retrieve server version information",
    tags: ["server"],
    summary: "Gets the server version details",
    response: {
      200: {
        description: "Successful response",
        type: "object",
        properties: {
          result: {
            type: "object",
            properties: {
              isSuccess: { type: "boolean" },
              code: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  revision: { type: "number" },
                  release: { type: "number" },
                  beta: { type: "number" },
                  test: { type: "number" },
                  main: { type: "number" },
                  early: { type: "number" },
                  lastRevision: { type: "number" },
                  lastMain: { type: "number" },
                  lastEarly: { type: "number" },
                  discovery: { type: "boolean" },
                  platform: {
                    type: "object",
                    properties: {
                      manufacturer: { type: "string" },
                      model: { type: "string" },
                      serial: { type: "string" },
                      mac: { type: "string" },
                      jdk: { type: "string" },
                    },
                    required: [
                      "manufacturer",
                      "model",
                      "serial",
                      "mac",
                      "jdk",
                    ],
                  },
                  branch: { type: "string" },
                  version: { type: "string" },
                  lastVersion: { type: "string" },
                  owner: { type: "string" },
                  manufacturer: { type: "string" },
                  model: { type: "string" },
                  serial: { type: "string" }
                },
                required: [
                  "revision",
                  "release",
                  "beta",
                  "test",
                  "main",
                  "early",
                  "lastRevision",
                  "lastMain",
                  "lastEarly",
                  "discovery",
                  "platform",
                  "branch",
                  "version",
                  "lastVersion",
                  "owner",
                  "manufacturer",
                  "model",
                  "serial"
                ],
              },
            },
            required: ["isSuccess", "code", "message", "data"],
          },
        },
      },
    },
  },
};
