"use strict";

const build = require("./app");
const { WebSocketServer } = require("ws");

let server;

const responseRules = [
  {
    match: (message) => message.params?.account?.login?.login === "testLogin",
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          login: {
            question: {
              delay: 0,
              type: "QUESTION_TYPE_PASSWORD",
            },
          },
        },
      },
    }),
  },
  {
    match: (message) =>
      message.params?.account?.answer?.data === "testPassword",
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          answer: {
            status: "ACCOUNT_RESPONSE_SUCCESS",
            message: "Успешная авторизация",
            token: "testToken",
          },
        },
      },
    }),
  },
  {
    match: (message) => message.params?.characteristic?.update?.aId === 167,
    response: (message) => ({
      id: message.id,
      result: {
        accessoryId: 167,
        serviceId: 13,
        characteristicId: 15,
        control: {
          value: false,
        },
        result: {
          isSuccess: true,
          code: 0,
          message: "Success",
        },
      },
    }),
  },
  // Add more rules as needed...
];

describe("POST /update", () => {
  let app;

  beforeAll(async () => {
    // Start a mock WebSocket server
    server = new WebSocketServer({ port: 1237 });

    server.on("connection", (ws) => {
      ws.on("message", (data) => {
        const receivedMessage = JSON.parse(data);
        const rule = responseRules.find((rule) => rule.match(receivedMessage));
        const response = rule
          ? rule.response(receivedMessage)
          : {
              id: receivedMessage.id,
              receivedMessage: JSON.stringify(receivedMessage),
              error: "No matching rule for message",
            };
        // Send the response back to the client
        ws.send(JSON.stringify(response));
      });
    });

    app = await build({
      // Add any plugin options required for the test environment
    });
    await app.ready();
    await app.sprut.connected();
  });

  afterAll(async () => {
    await app.close();

    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should update an accessory successfully", async () => {
    const updateData = {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      control: {
        value: true
      }
    };

    const response = await app.inject({
      method: "POST",
      url: "/update",
      payload: updateData,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      result: {
        isSuccess: true,
        code: 0,
        message: expect.any(String),
      },
    });
  });

  test("should handle errors gracefully", async () => {
    // Assuming an invalid payload leads to an error
    const invalidData = {
      accessoryId: -1, // Invalid data for testing error handling
    };

    const response = await app.inject({
      method: "POST",
      url: "/update",
      payload: invalidData,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      error: "Bad Request",
      message: "body must have required property 'serviceId'",
      statusCode: 400,
    });
  });
});
