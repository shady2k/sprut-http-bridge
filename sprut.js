const WebSocket = require("ws");

class Sprut {
  constructor(opts) {
    const { wsUrl, sprutLogin, sprutPassword, serial, logger } = opts;
    this.log = logger;
    this.wsUrl = wsUrl;
    this.sprutLogin = sprutLogin;
    this.sprutPassword = sprutPassword;
    this.token = null;
    this.serial = serial;
    this.isConnected = false;
    this.idCounter = 1;
    this.pendingRequests = {}; // Store pending requests

    if (!wsUrl || !sprutLogin || !sprutPassword || !serial) {
      throw new Error("wsUrl, sprutLogin, sprutPassword, serial must be set");
    }
    this.wsClient = new WebSocket(wsUrl);
    this.wsClient.on("open", () => this.handleConnection());
    this.wsClient.on("message", (data) => this.onMessage(data));
    this.wsClient.on("close", () => this.handleDisconnection());
    this.wsClient.on("error", (error) => this.handleError(error));
  }

  onMessage(data) {
    try {
      const response = JSON.parse(data);
      const id = response.id;
      if (this.pendingRequests[id]) {
        this.pendingRequests[id](response.result); // Resolve the promise with the response
        delete this.pendingRequests[id]; // Clean up the entry
      }
    } catch (error) {
      this.log.error("Error parsing message:", error);
    }
  }

  handleConnection() {
    this.log.info("WebSocket connected");
    this.isConnected = true;
    // Implement initial request logic here
  }

  handleDisconnection() {
    this.log.info("WebSocket connection closed");
    this.isConnected = false;
    // Implement reconnection logic here
  }

  handleError(error) {
    this.log.error("WebSocket error:", error);
    // Implement error handling logic here
  }

  call(json) {
    return new Promise((resolve, reject) => {
      const id = this.getNextId();
      this.pendingRequests[id] = resolve; // Store the resolve function for later
      const payload = {
        jsonrpc: "2.0",
        params: json,
        id,
      };
      if (this.token) {
        payload.token = this.token;
        payload.serial = this.serial;
      }

      this.sendJson(payload).catch(reject);
    });
  }

  getNextId() {
    return this.idCounter++;
  }

  sendJson(json) {
    return new Promise((resolve, reject) => {
      this.wsClient.send(JSON.stringify(json), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        try {
          this.wsClient.close();
          this.isConnected = false;
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  }

  _getNestedProperty(obj, path, defaultValue) {
    return path.reduce(
      (acc, key) => (acc && acc[key] ? acc[key] : defaultValue),
      obj
    );
  }

  async auth() {
    return new Promise((resolve, reject) => {
      this.call({
        account: {
          login: {
            login: this.sprutLogin,
          },
        },
      })
        .then((loginCall) => {
          if (
            this._getNestedProperty(loginCall, [
              "account",
              "login",
              "question",
              "type",
            ]) !== "QUESTION_TYPE_PASSWORD"
          ) {
            reject(new Error("Expected password question type."));
          } else {
            this.call({
              account: {
                answer: {
                  data: this.sprutPassword,
                },
              },
            })
              .then((passwordCall) => {
                if (
                  this._getNestedProperty(passwordCall, [
                    "account",
                    "answer",
                    "status",
                  ]) !== "ACCOUNT_RESPONSE_SUCCESS"
                ) {
                  reject(new Error("Authentication failed."));
                } else {
                  resolve({
                    isError: false,
                    result: {
                      token: passwordCall.account.answer.token,
                    },
                  });
                }
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  }

  async execute(command, { accessoryId, serviceId, characteristicId, value }) {
    // Check if the command is allowed
    const commands = ["update"];
    if (!commands.includes(command)) {
      throw new Error("Command not allowed");
    }

    // Validate parameters
    if (!accessoryId || !serviceId || !characteristicId) {
      throw new Error("accessoryId, serviceId, characteristicId must be set");
    }

    if (value !== true && value !== false) {
      throw new Error("value must be set");
    }

    // Ensure connection
    if (!this.isConnected) {
      throw new Error("Not connected");
    }

    // Authenticate if not already authenticated
    if (!this.token) {
      const authResult = await this.auth();
      if (authResult.isError) {
        throw new Error("Authentication failed.");
      } else {
        this.token = authResult.result.token;
      }
    }

    // Ensure connection and authentication are successful
    if (!this.isConnected || !this.token) {
      throw new Error("Connection or authentication failed.");
    }

    // Execute the command
    try {
      await this.call({
        characteristic: {
          update: {
            aId: accessoryId,
            sId: serviceId,
            cId: characteristicId,
            value: {
              boolValue: value,
            },
          },
        },
      });
      this.log.info("Command executed successfully");
      return 'success';
    } catch (error) {
      this.log.error("Error executing command:", error);
      throw error; // Rethrow the error to be caught by the caller
    }
  }
}

module.exports = Sprut;