# Chat API

A backend service for a real-time chat application. It provides a REST API for accounts, friends, direct and group conversations, messages, user profiles, public-key exchange, administrative broadcasts, and file attachments. A WebSocket endpoint supports live events such as incoming messages and typing/presence updates.

## Contents

- [Project description](#project-description)
- [Features](#features)
- [Technologies used](#technologies-used)
- [Requirements](#requirements)
- [Folder structure](#folder-structure)
- [Installation and setup](#installation-and-setup)
- [Environment variables](#environment-variables)
- [Running the API](#running-the-api)
- [REST API endpoints](#rest-api-endpoints)
- [WebSocket connection](#websocket-connection)
- [Testing](#testing)
- [Security and deployment notes](#security-and-deployment-notes)
- [Troubleshooting](#troubleshooting)

## Project description

Chat API is the server-side component of a chat application. It exposes authenticated HTTP endpoints for managing users and conversations, and a WebSocket connection for delivering events in real time. MongoDB stores application data, while Mongoose defines and accesses the data models.

The API is intended to be used by a separate frontend client (for example, the React/Vite client in this project). Authentication is token-based: users register or log in to obtain a JWT, then include that token when calling protected endpoints.

## Features

- User registration and login with JWT authentication.
- User profile retrieval and updates.
- Friend discovery, friend requests, and request acceptance/rejection.
- Direct conversation creation/opening and conversation listing.
- Group creation and management, including members and administrators.
- Message history retrieval and persisted unread-message state.
- Real-time WebSocket communication.
- Public-key publishing and retrieval for conversations.
- Administrative broadcast feed.
- Image, audio, and PDF attachment upload/download.
- Security middleware, request logging, CORS configuration, and authentication rate limiting.
- Optional direct HTTPS configuration and reverse-proxy support.

## Technologies used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime for the backend. |
| Express | HTTP server and REST API routing. |
| MongoDB | Database for users, messages, conversations, and related records. |
| Mongoose | MongoDB object modeling and database access. |
| `ws` | WebSocket server for real-time communication. |
| JSON Web Tokens (JWT) | Authentication tokens for protected endpoints. |
| `dotenv` | Loads environment variables from `.env`. |
| Helmet | Adds common HTTP security headers. |
| CORS | Controls which frontend origins can call the API. |
| Morgan | HTTP request logging. |
| Nodemon | Restarts the server automatically during development. |
| Jest | Test runner. |
| Supertest | HTTP endpoint testing. |
| `mongodb-memory-server` | Temporary MongoDB instance for tests. |

## Requirements

Install the following before setting up the backend:

- Node.js (use a current supported LTS version).
- npm (installed with Node.js).
- MongoDB Community Server, MongoDB Atlas, or another reachable MongoDB deployment.
- Git, if cloning the repository.

## Folder structure

The backend directory should have a structure similar to the following. Some files may differ slightly depending on the current project version.

```text
chat-api/
├── .env                  # Local secrets/configuration; do not commit
├── .env.example          # Environment-variable template
├── package.json          # Dependencies and npm scripts
├── package-lock.json
├── src/
│   ├── app.js             # Express app, middleware, route mounting
│   ├── server.js          # Database connection and HTTP/WebSocket startup
│   ├── config/
│   │   ├── database.js    # MongoDB connection setup
│   │   └── env.js         # Environment-variable loading/validation
│   ├── controllers/       # Endpoint business logic
│   ├── middleware/        # Authentication, validation/error handling, rate limits
│   ├── models/            # Mongoose schemas and models
│   ├── payloads/          # Message/event payload definitions or helpers
│   ├── routes/            # REST endpoint definitions
│   ├── services/          # Shared business logic
│   └── websocket/         # WebSocket setup, authentication, and event handling
└── tests/                 # Automated tests, if included in this checkout
```

### Where to make changes

- Add or change an HTTP endpoint in `src/routes/`.
- Implement endpoint logic in the matching file under `src/controllers/`.
- Change MongoDB schemas in `src/models/`.
- Change authentication, error handling, or rate limiting in `src/middleware/`.
- Change WebSocket event handling in `src/websocket/`.
- Change configuration in `src/config/` and `.env.example`.

## Installation and setup

Run the commands from the **backend `chat-api` directory** (the directory containing `package.json`).

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

If `.env.example` is not present in your checkout, create `.env` using the variables listed in the next section.

### 3. Configure MongoDB and secrets

Open `.env`. For local development, a typical starting configuration is:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chat-api
NODE_ENV=development
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
KEY_ENCRYPTION_SECRET=REPLACE_WITH_A_DIFFERENT_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY=false
HTTPS=false
```

Replace the example secrets and admin password with your own values. Do not reuse the sample values in a real deployment. Make sure MongoDB is running and that `MONGO_URI` points to the correct database.

### 4. Start MongoDB

Start your local MongoDB service, or confirm that your MongoDB Atlas cluster is reachable. If you use Atlas, replace the local `MONGO_URI` with your Atlas connection string and ensure network access and database credentials are configured.

### 5. Start the API

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

By default, the backend listens on:

- REST API: `http://localhost:5000`
- WebSocket: `ws://localhost:5000/ws`
- Health check: `http://localhost:5000/health`

Check the health endpoint in a browser or with curl:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "chat-api"
}
```

### 6. Connect the frontend

The Vite frontend commonly runs at `http://localhost:5173`. Set `CORS_ORIGIN` to the frontend origin. The frontend must use the correct backend API URL and the WebSocket endpoint `/ws`. If using a Vite development proxy, configure both HTTP proxying for `/api` and WebSocket proxying for `/ws`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP/WebSocket port. Defaults to `5000`. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `NODE_ENV` | No | Runtime mode, commonly `development` or `production`. |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs. Use a unique random value of at least 32 characters. |
| `KEY_ENCRYPTION_SECRET` | Yes | Secret used for server-side key encryption. Use a different unique random value of at least 32 characters. |
| `ADMIN_EMAIL` | For configured admin seeding | Email for the initial/admin account. |
| `ADMIN_USERNAME` | For configured admin seeding | Username for the initial/admin account. |
| `ADMIN_PASSWORD` | For configured admin seeding | Strong password for the initial/admin account. |
| `CORS_ORIGIN` | No | Allowed frontend origin; for local Vite development, use `http://localhost:5173`. |
| `TRUST_PROXY` | No | Enable only when deployed behind a trusted reverse proxy. |
| `HTTPS` | No | Set to `true` only if Node should serve HTTPS directly. Otherwise use `false`. |
| `HTTPS_KEY_PATH` | If `HTTPS=true` | Path to the TLS private key. |
| `HTTPS_CERT_PATH` | If `HTTPS=true` | Path to the TLS certificate. |

Never commit `.env`, private keys, JWT secrets, encryption secrets, or real admin credentials to Git.

## Running the API

| Command | Purpose |
|---|---|
| `npm install` | Installs project dependencies. |
| `npm run dev` | Starts the server with Nodemon for development. |
| `npm start` | Starts the server using Node.js. |
| `npm test` | Runs the Jest test suite. |
| `npm run test:watch` | Runs tests in watch mode. |
| `npm run test:coverage` | Runs tests and generates coverage information. |

## REST API endpoints

Base URL for local development: `http://localhost:5000`

**Authentication:** except for `GET /health`, `POST /api/auth/register`, and `POST /api/auth/login`, the routes below are mounted behind authentication middleware. Send the JWT in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The tables describe the route paths registered by the backend. Required JSON fields, query parameters, response shapes, and role restrictions should be confirmed in the corresponding controller and validation code before integrating a client.

### Health and authentication

| Method | Endpoint | Purpose | Auth required? |
|---|---|---|---|
| `GET` | `/health` | Checks whether the API is responding. | No |
| `POST` | `/api/auth/register` | Registers a new account. | No |
| `POST` | `/api/auth/login` | Authenticates an account and returns login credentials/token. | No |

### Users and profiles

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/users/me` | Retrieves the signed-in user's profile. |
| `PATCH` | `/api/users/me` | Updates supported fields on the signed-in user's profile. |

### Friends and friend requests

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/friends` | Lists the signed-in user's friends. |
| `GET` | `/api/friends/search` | Searches for users/friends according to the controller's supported query parameters. |
| `POST` | `/api/friends/requests` | Creates a friend request using the request body expected by the controller. |
| `POST` | `/api/friends/username/:username` | Sends a friend request to a user identified by username. |
| `GET` | `/api/friends/requests/incoming` | Lists incoming friend requests. |
| `POST` | `/api/friends/requests/:requestId/accept` | Accepts a friend request by its request ID. |
| `POST` | `/api/friends/requests/:requestId/reject` | Rejects a friend request by its request ID. |

### Conversations and messages

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/conversations` | Lists conversations available to the signed-in user, including unread-count information where implemented. |
| `POST` | `/api/conversations/direct` | Opens or creates a direct conversation with another user; see the controller for the required body. |
| `GET` | `/api/conversations/:conversationId` | Retrieves details for a specific conversation. |
| `GET` | `/api/conversations/:conversationId/messages` | Retrieves message history for a conversation. |

### Groups

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/groups` | Creates a group conversation. |
| `PATCH` | `/api/groups/:conversationId` | Updates supported group details. |
| `DELETE` | `/api/groups/:conversationId` | Deletes a group, subject to authorization rules. |
| `POST` | `/api/groups/:conversationId/members` | Adds a member to a group. |
| `DELETE` | `/api/groups/:conversationId/members/:userId` | Removes a member from a group. |
| `PATCH` | `/api/groups/:conversationId/members/:userId/admin` | Changes a member's group-admin status. |
| `POST` | `/api/groups/:conversationId/leave` | Allows the signed-in user to leave a group. |

### Public keys

| Method | Endpoint | Purpose |
|---|---|---|
| `PUT` | `/api/keys/public` | Publishes or updates the signed-in user's public key. |
| `GET` | `/api/keys/conversation/:conversationId` | Retrieves public-key information for members of a conversation, according to the controller's access checks. |

### Broadcasts

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/broadcasts` | Retrieves broadcasts available to the signed-in user. |

### Attachments and files

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| `POST` | `/api/conversations/:conversationId/attachments` | Uploads an image, audio file, or PDF for a conversation. | Sends raw file bytes with an accepted `Content-Type`; maximum request size is 15 MB. Requires conversation access. |
| `GET` | `/api/files/:filename` | Downloads or retrieves an uploaded file. | Requires authentication and passes the backend's access checks. |

For uploads, the route accepts media types matching `image/*`, `audio/*`, and `application/pdf`. Check `src/controllers/attachment.controller.js` for the expected headers, response format, file-name handling, and supported file validation.

### API endpoint notes

- `:conversationId`, `:requestId`, and `:userId` are path parameters that must be replaced with actual IDs.
- Protected routes require a valid JWT in the `Authorization` header.
- The authentication routes are rate-limited.
- Use the controllers as the source of truth for request-body fields, response schemas, permissions, and error codes.
- Not every real-time action is an HTTP endpoint; live events are sent through WebSockets.

## WebSocket connection

Local WebSocket URL:

```text
ws://localhost:5000/ws
```

The WebSocket connection is used for real-time application updates, such as new messages, typing indicators, online/offline presence, friend-request updates, group events, and administrative broadcast notifications, depending on the event handlers enabled in the current version.

The exact event names, message envelope, and authentication handshake are defined in `src/websocket/`. Keep the frontend and backend event names and authentication method in sync. In production, use `wss://` through HTTPS and a reverse proxy configured to support WebSocket upgrades.

## Unread messages

Unread counts should be based on persisted per-member read state in MongoDB rather than only React state or browser storage. When debugging unread counts:

1. Confirm that new messages are saved successfully.
2. Confirm that read-state fields are updated when the user reads a conversation.
3. Inspect the response from `GET /api/conversations` for the unread-count field.
4. Ensure the frontend does not overwrite a server-provided count with a default value after reload.

## Testing

Run the test suite:

```bash
npm test
```

Run tests continuously while editing:

```bash
npm run test:watch
```

Run with coverage:

```bash
npm run test:coverage
```

If tests start an in-memory MongoDB instance, the first run may take longer while the test database binary is prepared.

## Security and deployment notes

- Keep `.env` out of version control.
- Generate unique, random secrets for `JWT_SECRET` and `KEY_ENCRYPTION_SECRET`.
- Use HTTPS/WSS in production.
- Restrict `CORS_ORIGIN` to the actual frontend domain.
- Set `TRUST_PROXY=true` only when the application is behind a trusted reverse proxy that is correctly configured.
- Use a process manager or service manager to keep the server running in production.
- Ensure MongoDB is not exposed publicly without appropriate network restrictions and authentication.
- Configure persistent storage, backups, and retention for uploaded files.
- Do not assume attachments are end-to-end encrypted unless client-side attachment encryption has been implemented and tested.
- Verify role and membership checks for group administration, file access, and administrative broadcast operations before deploying.

## Troubleshooting

### `MONGO_URI` or database connection errors

Confirm MongoDB is running and `MONGO_URI` points to the correct database. For MongoDB Atlas, check the username/password, network access list, and connection string.

### `JWT_SECRET` or encryption-secret validation errors

Set `JWT_SECRET` and `KEY_ENCRYPTION_SECRET` to different strong values, at least 32 characters each, if required by your current configuration.

### Port 5000 is already in use

Stop the process already using port 5000, or change `PORT` in `.env` and update the frontend/proxy configuration to match.

### WebSocket connection fails

- Confirm the backend is running.
- Confirm the path is `/ws`.
- Check the browser's WebSocket URL and authentication handshake.
- If using Vite or Nginx as a proxy, confirm WebSocket upgrades are enabled and forwarded to the backend.

### CORS errors

Set `CORS_ORIGIN` to the exact frontend origin, including scheme and port, for example `http://localhost:5173`. Restart the backend after changing `.env`.

### Attachment upload fails

Confirm the user is authenticated and belongs to the target conversation, the request uses an accepted content type, and the file is below the configured 15 MB request limit.
