# Sprut HTTP Bridge

A RESTful HTTP to WebSocket bridge for interacting with Sprut services, enabling seamless communication between HTTP clients and Sprut's WebSocket-based smart home ecosystem.

## Caution

**Important:** Do not expose this service directly to the internet. Ensure that it is behind a firewall or use it within a secure network environment. Direct exposure can lead to unauthorized access and control of your connected devices.

## Features

- **Easy setup:** Quick and straightforward setup process.
- **Environment specific configuration:** Supports different configurations for development, production, and testing environments.
- **Comprehensive logging:** Detailed and environment-specific logging for easier debugging and monitoring.
- **Swagger UI integration:** Comes with integrated Swagger UI for exploring and testing the API endpoints.
- **Robust WebSocket management:** Includes reconnection logic and message queue management for reliable communication with Sprut services.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.


### Prerequisites

Node.js (version >=14.0.0)

### Installing

Clone the repository:

```bash

git clone https://github.com/shady2k/sprut-http-bridge.git
cd sprut-http-bridge
```

Install NPM packages:

```bash
npm install
```

Set up your environment variables by creating .env files for your specific environment (development, production, test). Example for development:

`.env.development`
```bash
NODE_ENV=development
LISTENING_PORT=3000
LISTENING_HOST=localhost
WS_URL=your_websocket_url
SPRUT_LOGIN=your_sprut_login
SPRUT_PASSWORD=your_sprut_password
SPRUT_SERIAL=your_sprut_serial
```

## Running

### For development:

```bash
npm run dev
```

### For production:
```bash
npm start
```

## Docker Support

To simplify deployment, you can use Docker. Here’s how you can use the provided Dockerfile:

Build your Docker image:

```bash
docker build -t sprut-http-bridge .
```

Once the image is built, you can run it:
```bash
docker run -p 3000:3000 sprut-http-bridge
```

This will start the Sprut HTTP Bridge and expose it on port 3000 on your host.

## Usage

After starting the server, you can interact with the API using the following endpoints:

`POST /update`

Updates a device state. Requires device and state information in the request body.

`GET /version`

Returns the current version of the connected Sprut service.

For detailed request and response models, visit the Swagger UI at /.


## Contributing

PRs are welcome.


### License

This project is licensed under the MIT License - see the LICENSE.md file for details