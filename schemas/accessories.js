module.exports = {
  schema: {
    description: "Retrieve list of all accessories (smart home devices) with their services and characteristics",
    tags: ["devices"],
    summary: "Gets all devices with detailed information including controllable characteristics",
    querystring: {
      type: "object",
      properties: {
        expand: {
          type: "string",
          description: "Comma-separated list of properties to expand (default: services,characteristics)",
          default: "services,characteristics"
        }
      }
    },
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
                    manufacturer: { type: "string" },
                    model: { type: "string" },
                    online: { type: "boolean" },
                    roomId: { type: "number" },
                    services: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sId: { type: "number" },
                          name: { type: "string" },
                          type: { type: "string" },
                          characteristics: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                cId: { type: "number" },
                                control: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                    type: { type: "string" },
                                    value: {},
                                    write: { type: "boolean" },
                                    read: { type: "boolean" },
                                    events: { type: "boolean" },
                                    validValues: { type: "array" },
                                    minValue: { type: "number" },
                                    maxValue: { type: "number" },
                                    minStep: { type: "number" }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
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