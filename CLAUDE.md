# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development mode:** `npm run dev` - Runs with nodemon for auto-restart and environment-specific configuration
- **Production:** `npm start` - Starts the application in production mode
- **Testing:** `npm test` - Runs Jest test suite with coverage collection
- **Linting:** `npm run lint` - ESLint code analysis
- **Lint & fix:** `npm run lint:fix` - Auto-fix ESLint issues
- **Pre-publish:** `npm run prepublish` - Runs lint and test before publishing
- **Docker build:** `npm run build` - Builds Docker image with current package version tag
- **Docker build:** `npm run build` - Builds Docker image with current package version tag

## Architecture Overview

This is a **RESTful HTTP to WebSocket bridge** that enables communication between HTTP clients and Sprut's WebSocket-based smart home ecosystem.

### Core Components

1. **Fastify Application (`app.js`)**: Main HTTP server with dynamic API generation
   - Dynamically generates REST endpoints from spruthub-client schemas
   - Integrated Swagger UI with automatic documentation generation
   - Generic request handler that works with any method from the schema
   - Automatic parameter construction for GET requests with nested schemas
   - Uses environment-specific configuration and logging

2. **Sprut WebSocket Client (`sprut.js`)**: Core WebSocket connection manager
   - **Queue class**: Manages async request/response mapping with timeouts
   - **Sprut class**: Handles authentication, connection management, and command execution
   - Implements automatic reconnection logic and token refresh
   - Supports dynamic method calls through `callMethod()` interface

3. **Dynamic Schema Integration**: Uses spruthub-client schemas
   - Imports schemas directly from spruthub-client package
   - Automatically generates Fastify validation schemas from spruthub-client definitions
   - Supports nested parameter structures with automatic flattening for GET requests
   - Includes Swagger definitions for proper API documentation

### Key Patterns

- **Environment-based configuration**: Uses `.env.{NODE_ENV}` files for environment-specific settings
- **Async/await throughout**: Modern JavaScript async patterns
- **Dynamic endpoint generation**: REST endpoints automatically created from schema definitions
- **Request queuing**: WebSocket responses are matched to requests via unique IDs
- **Auto-retry authentication**: Refreshes tokens automatically on authentication errors
- **Structured logging**: Environment-specific logger configuration with pino
- **Parameter type coercion**: Automatic conversion of string parameters to appropriate types

### Environment Configuration

Required environment variables (see `.env`):
- `WS_URL`: Sprut WebSocket server URL
- `SPRUT_EMAIL`: Authentication email address
- `SPRUT_PASSWORD`: Authentication password
- `SPRUT_SERIAL`: Device serial number
- `LISTENING_PORT`: HTTP server port (default: 3000)
- `LISTENING_HOST`: HTTP server host (default: localhost)

### WebSocket Protocol

The bridge communicates with Sprut using a JSON-RPC 2.0 style protocol through the spruthub-client:
- Authentication flow: auth request → email challenge → password challenge → token
- Dynamic method calls: Any method defined in spruthub-client schemas can be called
- All requests include token and serial for authorization
- Response handling through the Queue class for proper async operation

### Testing Strategy

Tests are located in `*.test.js` files and use Jest. The test environment:
- Mocks WebSocket connections for isolation
- Tests both HTTP endpoints and WebSocket client functionality
- Coverage collection is enabled by default

### Docker Support

Standard Node.js Docker setup with production optimization:
- Uses official Node.js LTS image
- Production dependencies only (`npm ci --omit=dev`)
- Exposes port 3000 by default