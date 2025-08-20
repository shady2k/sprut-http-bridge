module.exports = {
  schema: {
    description: "Retrieve list of all Sprut hubs in the system",
    tags: ["hubs"],
    summary: "Gets all hubs with their versions, platform details, and status",
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
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    version: {
                      type: "object",
                      properties: {
                        revision: { type: "number" },
                        release: { type: "number" },
                        beta: { type: "number" },
                        test: { type: "number" },
                        main: { type: "number" },
                        early: { type: "number" },
                        version: { type: "string" },
                        branch: { type: "string" }
                      }
                    },
                    platform: {
                      type: "object",
                      properties: {
                        manufacturer: { type: "string" },
                        model: { type: "string" },
                        serial: { type: "string" },
                        mac: { type: "string" },
                        jdk: { type: "string" }
                      }
                    },
                    online: { type: "boolean" },
                    lastSeen: { type: "string" }
                  }
                }
              }
            },
            required: ["isSuccess", "code", "message", "data"]
          }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          error: { type: "string" }
        }
      }
    }
  }
};