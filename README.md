# Sprut HTTP Bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-green)](https://nodejs.org/)

A RESTful HTTP to WebSocket bridge for interacting with [Sprut Hub](https://spruthub.ru/) services, enabling seamless communication between HTTP clients and Sprut's WebSocket-based smart home ecosystem.

## 🔒 Security Notice

**⚠️ Important:** Do not expose this service directly to the internet. Ensure that it is behind a firewall or use it within a secure network environment. Direct exposure can lead to unauthorized access and control of your connected devices.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 14.0.0
- **npm** (included with Node.js)

### Installation

#### Method 1: Docker (Recommended)

```bash
# Pull the latest image
docker pull ghcr.io/shady2k/sprut-http-bridge:main

# Create environment file from template
cp .env .env.docker
# Edit .env.docker with your Sprut credentials

# Run the container
docker run -d \
  --name sprut-bridge \
  -p 3000:3000 \
  --env-file .env.docker \
  ghcr.io/shady2k/sprut-http-bridge:main
```

#### Method 2: From Source

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shady2k/sprut-http-bridge.git
   cd sprut-http-bridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create environment-specific configuration files (`.env.development`, `.env.production`, `.env.test`):

   **`.env.development` (example):**
   ```env
   NODE_ENV=development
   LISTENING_PORT=3000
   LISTENING_HOST=localhost
   WS_URL=wss://your-sprut-server.com/ws
   SPRUT_EMAIL=your-email@example.com
   SPRUT_PASSWORD=your-password
   SPRUT_SERIAL=your-device-serial
   ```

   > **Note:** Replace `SPRUT_LOGIN` with `SPRUT_EMAIL` as per the current implementation

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
*Runs with nodemon for auto-restart and development-specific logging*

### Production Mode
```bash
npm start
```
*Optimized for production with appropriate logging levels*

### Testing
```bash
npm test          # Run Jest tests with coverage
npm run lint      # ESLint code analysis  
npm run lint:fix  # Auto-fix ESLint issues
```

## 🐳 Docker Deployment

### Using Pre-built Images

Pre-built multi-architecture images are automatically built and published to GitHub Container Registry:

```bash
# Latest version from main branch
docker pull ghcr.io/shady2k/sprut-http-bridge:main

# Specific version (replace with actual version)
docker pull ghcr.io/shady2k/sprut-http-bridge:v1.0.3
```

### Build Locally
```bash
# Simple build
npm run build

# Multi-platform build (requires Docker Buildx)
npm run docker:build
```

## 📖 API Documentation

Once the server is running, access the **interactive Swagger UI** at:
```
http://localhost:3000/
```

### Available Endpoints

#### `POST /update`
Updates a device state in your Sprut smart home system.

**Request Body Example:**
```json
{
  "accessoryId": "12345",
  "serviceId": "67890",
  "characteristicId": "abc123",
  "value": true
}
```

#### `GET /version`
Returns the version information of the connected Sprut service.

**Response Example:**
```json
{
  "version": "2.1.0",
  "build": "12345"
}
```

## 🏗️ Architecture

- **Fastify HTTP Server** - High-performance web framework with built-in validation
- **WebSocket Client** - Manages persistent connection to Sprut services
- **Request Queue** - Handles async request/response mapping with timeouts  
- **Auto-reconnection** - Automatic token refresh and connection recovery
- **Environment-based Config** - Separate configurations for dev/prod/test

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development`, `production`, `test` |
| `LISTENING_PORT` | HTTP server port | `3000` |
| `LISTENING_HOST` | HTTP server host | `localhost` |
| `WS_URL` | Sprut WebSocket URL | `wss://sprut.example.com/ws` |
| `SPRUT_EMAIL` | Authentication email | `user@example.com` |
| `SPRUT_PASSWORD` | Authentication password | `your-password` |
| `SPRUT_SERIAL` | Device serial number | `ABC123XYZ` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

Found a bug or need help? Please [open an issue](https://github.com/shady2k/sprut-http-bridge/issues) on GitHub.