"use strict";

const build = require("./app");
const { WebSocketServer } = require("ws");

let server;

const responseRules = [
  {
    match: (message) => Array.isArray(message.params?.account?.auth?.params),
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          auth: {
            status: "ACCOUNT_RESPONSE_SUCCESS",
            question: {
              type: "QUESTION_TYPE_EMAIL",
            },
            label: {
              text: "Владелец - test***@**est.com",
            },
          },
        },
      },
    }),
  },
  {
    match: (message) =>
      message.params?.account?.answer?.data === "testEmail",
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          answer: {
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
        isSuccess: true,
        code: 0,
        message: "Success",
      },
    }),
  },
  {
    match: (message) => message.params?.server?.version !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: {
          revision: 1234,
          version: "2.5.1234",
          platform: "Sprut Tech Hub Pro"
        }
      }
    })
  },
  {
    match: (message) => message.params?.hub?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: [
          {
            id: "hub-001",
            name: "Main Hub",
            version: {
              revision: 1234,
              version: "2.5.1234",
            },
            platform: {
              manufacturer: "Sprut Tech",
              model: "Hub Pro",
            },
            online: true,
          }
        ]
      }
    })
  },
  {
    match: (message) => message.params?.accessory?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: [
          {
            id: 167,
            name: "Living Room Light",
            manufacturer: "Philips",
            model: "Hue Bulb",
            online: true,
            roomId: 1,
            services: [
              {
                sId: 13,
                name: "Lightbulb Service",
                type: "public.hap.service.lightbulb",
                characteristics: [
                  {
                    cId: 15,
                    control: {
                      name: "On",
                      type: "public.hap.characteristic.on",
                      value: false,
                      write: true,
                      read: true,
                      events: true
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    })
  },
  {
    match: (message) => message.params?.room?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: [
          {
            id: 1,
            name: "Living Room",
            visible: true,
          },
          {
            id: 2,
            name: "Kitchen",
            visible: true,
          }
        ]
      }
    })
  },
  {
    match: (message) => message.params?.system?.getFullInfo !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        hubs: [
          {
            id: "hub-001",
            name: "Main Hub",
            online: true
          }
        ],
        accessories: [
          {
            id: 167,
            name: "Living Room Light",
            manufacturer: "Philips",
            model: "Hue Bulb",
            online: true,
            roomId: 1
          }
        ],
        rooms: [
          {
            id: 1,
            name: "Living Room",
            visible: true
          },
          {
            id: 2,
            name: "Kitchen",
            visible: true
          }
        ],
        controllableDevices: [
          {
            accessoryId: 167,
            accessoryName: "Living Room Light",
            serviceId: 13,
            serviceName: "Lightbulb Service",
            serviceType: "public.hap.service.lightbulb",
            characteristicId: 15,
            characteristicName: "On",
            characteristicType: "public.hap.characteristic.on",
            currentValue: false,
            writable: true,
            readable: true,
            hasEvents: true
          }
        ],
        errors: []
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.get !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: {
          order: 94,
          type: "BLOCK",
          predefined: false,
          active: true,
          onStart: true,
          sync: false,
          error: false,
          index: "94",
          name: "",
          desc: "",
          data: '{"blockId":0,"targets":[{"type":"if","blockId":1,"if":{"type":"condition","blockId":2,"mode":"OR","conditions":[]},"then":[],"then_delay":0,"else_delay":0,"mode":"EVERY"}]}'
        }
      }
    })
  },
  {
    match: () => true,
    response: (message) => {
      console.log('UNMATCHED message:', JSON.stringify(message, null, 2));
      return {
        id: message.id,
        error: "No matching rule found"
      }
    }
  }
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
    // Wait for authentication to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      characteristic: {
        update: {
          aId: 167,
          sId: 13,
          cId: 15,
          control: {
            value: { boolValue: true }
          }
        }
      }
    };

    const response = await app.inject({
      method: "POST",
      url: "/update",
      payload: updateData,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      characteristic: {
        update: {
          aId: 167,
          sId: 13,
          cId: 15,
          control: {
            value: { boolValue: true }
          }
        }
      },
      result: {
        isSuccess: true,
        code: 0,
        message: expect.any(String),
      },
    });
  });

  test("should handle errors gracefully", async () => {
    // Invalid payload missing required fields
    const invalidData = {
      characteristic: {
        update: {
          aId: -1, // Invalid data for testing error handling
        }
      }
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
      message: expect.stringMatching(/must have required property/),
      statusCode: 400,
    });
  });
});

describe("GET /version", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get server version information successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/version",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toMatchObject({
      revision: expect.any(Number),
      version: expect.any(String),
      platform: expect.any(String)
    });
  });
});

describe("GET /hubs", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get list of hubs successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/hubs",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toBeInstanceOf(Array);
    expect(result.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          online: expect.any(Boolean),
          version: expect.objectContaining({
            version: expect.any(String),
            revision: expect.any(Number)
          }),
          platform: expect.objectContaining({
            manufacturer: expect.any(String),
            model: expect.any(String)
          })
        })
      ])
    );
  });
});

describe("GET /accessories", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get list of accessories successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/accessories",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toBeInstanceOf(Array);
    expect(result.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          manufacturer: expect.any(String),
          model: expect.any(String),
          online: expect.any(Boolean),
          roomId: expect.any(Number),
          services: expect.arrayContaining([
            expect.objectContaining({
              sId: expect.any(Number),
              name: expect.any(String),
              type: expect.any(String),
              characteristics: expect.any(Array)
            })
          ])
        })
      ])
    );
  });

  test("should handle expand query parameter", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/accessories?expand=services",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toBeInstanceOf(Array);
  });
});

describe("GET /rooms", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get list of rooms successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/rooms",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toBeInstanceOf(Array);
    expect(result.result).toHaveLength(2);
    expect(result.result[0]).toMatchObject({
      id: 1,
      name: "Living Room",
      visible: true
    });
  });
});

describe("GET /system-info", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get system information successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/system-info",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    
    expect(result).toHaveProperty("hubs");
    expect(result).toHaveProperty("accessories");
    expect(result).toHaveProperty("rooms");
    expect(result).toHaveProperty("controllableDevices");
    expect(result).toHaveProperty("errors");
    
    expect(result.hubs).toBeInstanceOf(Array);
    expect(result.accessories).toBeInstanceOf(Array);
    expect(result.rooms).toBeInstanceOf(Array);
    expect(result.controllableDevices).toBeInstanceOf(Array);
    expect(result.errors).toBeInstanceOf(Array);
  });
});

describe("GET /scenario/:id", () => {
  let app;

  beforeAll(async () => {
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
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should get a scenario by id successfully", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/scenarios/94?expand=data",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result).toMatchObject({
      order: expect.any(Number),
      type: expect.any(String),
      predefined: expect.any(Boolean),
      active: expect.any(Boolean),
      onStart: expect.any(Boolean),
      sync: expect.any(Boolean),
      error: expect.any(Boolean),
      index: expect.any(String),
      name: expect.any(String),
      desc: expect.any(String),
      data: expect.any(String),
    });
  });
});

describe("Error handling", () => {
  let app;

  beforeAll(async () => {
    server = new WebSocketServer({ port: 1237 });
    server.on("connection", (ws) => {
      ws.on("message", (data) => {
        const receivedMessage = JSON.parse(data);
        if (receivedMessage.method === 'error.test') {
          ws.send(JSON.stringify({
            id: receivedMessage.id,
            error: "Test error"
          }));
          return;
        }
        
        const rule = responseRules.find((rule) => rule.match(receivedMessage));
        const response = rule
          ? rule.response(receivedMessage)
          : {
              id: receivedMessage.id,
              receivedMessage: JSON.stringify(receivedMessage),
              error: "No matching rule for message",
            };
        ws.send(JSON.stringify(response));
      });
    });

    app = await build();
    await app.ready();
    await app.sprut.connected();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await app.close();
    for (const ws of server.clients) {
      ws.close();
    }
    server.close();
  });

  test("should handle server errors gracefully for all endpoints", async () => {
    const endpoints = [
      { method: "GET", url: "/version", sprutMethod: "version" },
      { method: "GET", url: "/hubs", sprutMethod: "listHubs" },
      { method: "GET", url: "/accessories", sprutMethod: "listAccessories" },
      { method: "GET", url: "/rooms", sprutMethod: "listRooms" },
      { method: "GET", url: "/system-info", sprutMethod: "getFullSystemInfo" }
    ];

    for (const endpoint of endpoints) {
      const mockError = jest.spyOn(app.sprut, endpoint.sprutMethod).mockRejectedValueOnce(new Error("Mock error"));
      
      const response = await app.inject(endpoint);
      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({
        error: "An error occurred while processing your request."
      });
      
      mockError.mockRestore();
    }
  });
});