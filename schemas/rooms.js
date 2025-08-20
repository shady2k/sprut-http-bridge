module.exports = {
  schema: {
    description: "Retrieve list of all rooms in the smart home system",
    tags: ["rooms"],
    summary: "Gets all rooms with their IDs, names, and visibility settings",
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
                    id: { type: "number" },
                    name: { type: "string" },
                    visible: { type: "boolean" },
                    order: { type: "number" }
                  },
                  required: ["id", "name"]
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