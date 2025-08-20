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
  {
    match: (message) => message.params?.server?.version !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        server: {
          version: {
            revision: 1234,
            release: 5,
            beta: 0,
            test: 0,
            main: 2,
            early: 0,
            lastRevision: 1200,
            lastMain: 1,
            lastEarly: 0,
            discovery: true,
            platform: {
              manufacturer: "Sprut Tech",
              model: "Hub Pro",
              serial: "SP123456",
              mac: "AA:BB:CC:DD:EE:FF",
              jdk: "11.0.1"
            },
            branch: "main",
            version: "2.5.1234",
            lastVersion: "2.1.1200",
            owner: "Test Owner",
            manufacturer: "Sprut Tech",
            model: "Hub Pro",
            serial: "SP123456"
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.hub?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        hub: {
          list: {
            hubs: [
              {
                id: "hub-001",
                name: "Main Hub",
                version: {
                  revision: 1234,
                  release: 5,
                  beta: 0,
                  test: 0,
                  main: 2,
                  early: 0,
                  version: "2.5.1234",
                  branch: "main"
                },
                platform: {
                  manufacturer: "Sprut Tech",
                  model: "Hub Pro",
                  serial: "SP123456",
                  mac: "AA:BB:CC:DD:EE:FF",
                  jdk: "11.0.1"
                },
                online: true,
                lastSeen: "2024-01-15T10:30:00Z"
              }
            ]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.accessory?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        accessory: {
          list: {
            accessories: [
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
        }
      }
    })
  },
  {
    match: (message) => message.params?.room?.list !== undefined,
    response: (message) => ({
      id: message.id,
      result: {
        room: {
          list: {
            rooms: [
              {
                id: 1,
                name: "Living Room",
                visible: true,
                order: 1
              },
              {
                id: 2,
                name: "Kitchen",
                visible: true,
                order: 2
              }
            ]
          }
        }
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
      isSuccess: true,
      code: 0,
      message: expect.any(String),
      data: expect.objectContaining({
        revision: expect.any(Number),
        release: expect.any(Number),
        version: expect.any(String),
        platform: expect.objectContaining({
          manufacturer: expect.any(String),
          model: expect.any(String),
          serial: expect.any(String)
        })
      })
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
    expect(result.result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: expect.any(String),
      data: expect.arrayContaining([
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
    });
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
    expect(result.result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: expect.any(String),
      data: expect.arrayContaining([
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
    });
  });

  test("should handle expand query parameter", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/accessories?expand=services",
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result).toHaveProperty("result");
    expect(result.result.data).toBeInstanceOf(Array);
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
    expect(result.result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: expect.any(String),
      data: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          visible: expect.any(Boolean)
        })
      ])
    });
    
    expect(result.result.data).toHaveLength(2);
    expect(result.result.data[0]).toMatchObject({
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
      { method: "GET", url: "/version" },
      { method: "GET", url: "/hubs" },
      { method: "GET", url: "/accessories" },
      { method: "GET", url: "/rooms" },
      { method: "GET", url: "/system-info" }
    ];

    for (const endpoint of endpoints) {
      const originalMethod = app.sprut[endpoint.url.replace('/', '').replace('-', '').replace('system-info', 'getFullSystemInfo').replace('accessories', 'listAccessories').replace('hubs', 'listHubs').replace('rooms', 'listRooms').replace('version', 'version')];
      
      if (originalMethod) {
        const mockError = jest.spyOn(app.sprut, endpoint.url.replace('/', '').replace('-', '').replace('systeminfo', 'getFullSystemInfo').replace('accessories', 'listAccessories').replace('hubs', 'listHubs').replace('rooms', 'listRooms').replace('version', 'version')).mockRejectedValueOnce(new Error("Mock error"));
        
        const response = await app.inject(endpoint);
        expect(response.statusCode).toBe(500);
        expect(response.json()).toMatchObject({
          error: "An error occurred while processing your request."
        });
        
        mockError.mockRestore();
      }
    }
  });
});
