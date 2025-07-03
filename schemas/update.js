module.exports = {
  schema: {
    description: "Update an accessory",
    tags: ["accessory"],
    summary: "Updates the specified accessory",
    body: {
      type: "object",
      properties: {
        accessoryId: { type: "number" },
        serviceId: { type: "number" },
        characteristicId: { type: "number" },
        control: {
          type: "object",
          properties: {
            value: { type: "boolean" },
          },
          required: ["value"],
        }
      },
      required: ["accessoryId", "serviceId", "characteristicId", "control"],
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
          "control",
          "result",
        ],
      },
    },
  },
};
