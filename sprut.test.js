const { WebSocketServer } = require("ws");
const Sprut = require("./sprut"); // Adjust the path as necessary

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
        value: false,
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

describe("Sprut WebSocket Interactions", () => {
  let server;
  let sprut;

  beforeAll(async () => {
    // Start a mock WebSocket server
    server = new WebSocketServer({ port: 1236 });

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

    // Initialize Sprut with mock WebSocket URL
    sprut = new Sprut({
      wsUrl: "ws://localhost:1236",
      sprutLogin: "testLogin",
      sprutPassword: "testPassword",
      serial: "testSerial",
      logger: {
        info: console.log,
        debug: jest.fn(),
        error: console.log,
      },
    });

    await sprut.connected();
  });

  afterAll(async () => {
    // Clean up after all tests
    await sprut.close();
    server.close(); // Close the mock WebSocket server
  });

  test("handles WebSocket connection", async () => {
    expect(sprut.isConnected).toBe(true);
  });

  test("sprut auth", async () => {
    const authResult = await sprut.auth();
    expect(authResult.isError).toBe(false);
    expect(authResult.result.token).toBe("testToken");
  });

  test("sprut execute command", async () => {
    const resultExecute = await sprut.execute("update", {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      value: false,
    });

    expect(resultExecute).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success",
    });
  });

  test("sprut reconnect", (done) => {
    for (const ws of server.clients) {
      ws.close();
    }

    setTimeout(async () => {
      await sprut.connected();
      expect(sprut.isConnected).toBe(true);
      done()
    }, 5000)
  }, 7000);
  // TODO: Check then execute command failed
  // TODO: Check if login or password is wrong
});
