"use strict";

const build = require("./app");
const { WebSocketServer } = require("ws");

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
        return {
          id: message.id,
          error: "No matching rule found"
        }
      }
    }
  ];

describe("Sprut.hub HTTP Bridge", () => {
  let app;
  let server;

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

  describe("POST /characteristics", () => {
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
        url: "/characteristics",
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        result: {
          isSuccess: true,
          code: 0,
          message: "Success",
        },
      });
    });

    test("should handle errors gracefully", async () => {
      const invalidData = {
        characteristic: {
          update: {
            aId: -1, // Invalid data for testing error handling
          }
        }
      };

      const response = await app.inject({
        method: "POST",
        url: "/characteristics",
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: "FST_ERR_VALIDATION",
        error: "Bad Request",
        message: "body/characteristic/update must have required property 'sId'",
        statusCode: 400,
      });
    });
  });

  describe("GET endpoints", () => {
    const endpoints = [
      {
        url: "/server/version",
        expected: {
            "result": {
                "data": {
                  "platform": "Sprut Tech Hub Pro",
                  "revision": 1234,
                  "version": "2.5.1234",
                },
                "isSuccess": true,
                "code": 0,
                "message": "Success"
            }
        }
      },
      {
        url: "/hubs",
        expected: {
            "result": {
                "data": [
                  {
                    "id": "hub-001",
                    "name": "Main Hub",
                    "online": true,
                    "platform": {
                      "manufacturer": "Sprut Tech",
                      "model": "Hub Pro",
                    },
                    "version": {
                      "revision": 1234,
                      "version": "2.5.1234",
                    },
                  },
                ],
                "isSuccess": true,
                "code": 0,
                "message": "Success"
            }
        }
      },
      {
        url: "/accessories",
        expected: {
            "result": {
                "data": [
                  {
                    "id": 167,
                    "manufacturer": "Philips",
                    "model": "Hue Bulb",
                    "name": "Living Room Light",
                    "online": true,
                    "roomId": 1,
                    "services": [
                      {
                        "characteristics": [
                          {
                            "cId": 15,
                            "control": {
                              "events": true,
                              "name": "On",
                              "read": true,
                              "type": "public.hap.characteristic.on",
                              "value": false,
                              "write": true,
                            },
                          },
                        ],
                        "name": "Lightbulb Service",
                        "sId": 13,
                        "type": "public.hap.service.lightbulb",
                      },
                    ],
                  },
                ],
                "isSuccess": true,
                "code": 0,
                "message": "Success"
            }
        }
      },
      {
        url: "/rooms",
        expected: {
            "result": {
                "data": [
                  {
                    "id": 1,
                    "name": "Living Room",
                    "visible": true,
                  },
                  {
                    "id": 2,
                    "name": "Kitchen",
                    "visible": true,
                  },
                ],
                "isSuccess": true,
                "code": 0,
                "message": "Success"
            }
        }
      },
      
      {
        url: "/scenarios/94?expand=data",
        expected: {
            "result": {
                "data": {
                    "active": true,
                    "data": '{"blockId":0,"targets":[{"type":"if","blockId":1,"if":{"type":"condition","blockId":2,"mode":"OR","conditions":[]},"then":[],"then_delay":0,"else_delay":0,"mode":"EVERY"}]}',
                    "desc": "",
                    "error": false,
                    "index": "94",
                    "name": "",
                    "onStart": true,
                    "order": 94,
                    "predefined": false,
                    "sync": false,
                    "type": "BLOCK",
                },
                "isSuccess": true,
                "code": 0,
                "message": "Success"
            }
        }
      },
    ];

    test.each(endpoints)("should get $url successfully", async ({ url, expected }) => {
      const response = await app.inject({
        method: "GET",
        url,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expected);
    });
  });

  describe("Error handling", () => {
    test("should handle sprut-client errors gracefully", async () => {
        const originalCallMethod = app.sprut.callMethod;
        app.sprut.callMethod = jest.fn().mockResolvedValue({
            isSuccess: false,
            message: "Sprut-client error"
        });

        const response = await app.inject({
            method: "GET",
            url: "/server/version",
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toEqual({
            error: "Sprut-client error"
        });

        app.sprut.callMethod = originalCallMethod;
    });

    test("should handle exceptions gracefully", async () => {
        const originalCallMethod = app.sprut.callMethod;
        app.sprut.callMethod = jest.fn().mockRejectedValue(new Error("Something went wrong"));

        const response = await app.inject({
            method: "GET",
            url: "/server/version",
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toEqual({
            error: "An error occurred while processing your request."
        });

        app.sprut.callMethod = originalCallMethod;
    });
  });
});
