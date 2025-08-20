module.exports = {
  schema: {
    description: "Retrieve comprehensive system information including hubs, devices, rooms, and controllable characteristics",
    tags: ["system"],
    summary: "Gets complete system state with all hubs, accessories, rooms, and controllable devices",
    response: {
      200: {
        description: "Successful response",
        type: "object",
        properties: {
          hubs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                online: { type: "boolean" }
              }
            }
          },
          accessories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                manufacturer: { type: "string" },
                model: { type: "string" },
                online: { type: "boolean" },
                roomId: { type: "number" }
              }
            }
          },
          rooms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                visible: { type: "boolean" }
              }
            }
          },
          controllableDevices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                accessoryId: { type: "number" },
                accessoryName: { type: "string" },
                serviceId: { type: "number" },
                serviceName: { type: "string" },
                serviceType: { type: "string" },
                characteristicId: { type: "number" },
                characteristicName: { type: "string" },
                characteristicType: { type: "string" },
                currentValue: {},
                writable: { type: "boolean" },
                readable: { type: "boolean" },
                hasEvents: { type: "boolean" }
              }
            }
          },
          errors: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["hubs", "accessories", "rooms", "controllableDevices", "errors"]
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