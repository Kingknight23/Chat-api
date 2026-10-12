Chat API
Backend service for the Chat application. It provides REST endpoints for authentication, conversations, friends, groups, messages, media attachments, unread-message tracking, and real-time communication over WebSockets.
Features
REST API built with Node.js and Express.
MongoDB persistence through Mongoose.
JWT-based authentication.
Real-time messaging and presence using the `ws` WebSocket library.
Friend requests and group conversations.
Image, audio, and PDF attachments.
Persistent unread-message tracking per conversation member.
Environment-based configuration and optional HTTPS support.
Automatic creation/seeding of the configured admin account at startup.
Requirements
Node.js (use a current LTS release).
npm.
MongoDB running locally or reachable through a MongoDB connection URI.
Install
Run these commands from this `chat-api` directory:
```powershell
npm install
```
Create your local environment file from the example:
```powershell
Copy-Item .env.example .env
```
Open `.env` and replace all placeholder secrets and admin credentials before starting the server.
Environment variables
Variable	Required	Description
`PORT`	No	HTTP/WebSocket port. Defaults to `5000`.
`MONGO_URI`	Yes	MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/chat-api`.
`NODE_ENV`	No	Runtime environment, such as `development` or `production`.
`JWT_SECRET`	Yes	Secret used to sign/verify JWTs. Must be at least 32 characters.
`KEY_ENCRYPTION_SECRET`	Yes	Secret used by the server's key-encryption functionality. Must be at least 32 characters.
`ADMIN_EMAIL`	Yes for admin seeding	Email for the initial/admin account.
`ADMIN_USERNAME`	Yes for admin seeding	Username for the initial/admin account.
`ADMIN_PASSWORD`	Yes for admin seeding	Strong password for the initial/admin account.
`CORS_ORIGIN`	No	Allowed frontend origin. Defaults to `http://localhost:5173`.
`TRUST_PROXY`	No	Set to `true` only when the app is behind a trusted reverse proxy.
`HTTPS`	No	Set to `true` to serve HTTPS/WSS directly from Node. Defaults to `false`.
`HTTPS_KEY_PATH`	When `HTTPS=true`	Path to the TLS private key.
`HTTPS_CERT_PATH`	When `HTTPS=true`	Path to the TLS certificate.
Generate unique, strong secrets for `JWT_SECRET` and `KEY_ENCRYPTION_SECRET`. Do not commit `.env` or production secrets to source control. Keep `HTTPS=false` for a typical local development setup.
Run the server
Development mode (restarts when files change):
```powershell
npm run dev
```
Production mode:
```powershell
npm start
```
By default, the server uses:
REST API: `http://localhost:5000`
WebSocket: `ws://localhost:5000/ws`
The server connects to MongoDB and seeds the configured admin account before listening for requests. If startup fails, verify `MONGO_URI`, both required secrets, and that MongoDB is reachable.
Frontend connection
The Vite frontend normally runs at `http://localhost:5173`. The frontend can connect directly to `ws://localhost:5000/ws`, or use the Vite development proxy configured in `client/vite.config.js` to proxy `/ws` and `/api` to port `5000`.
If the browser console shows a WebSocket error, check that:
The backend is running on port `5000`.
The WebSocket URL ends in `/ws`.
The frontend and backend agree on the authentication method.
The Vite proxy is configured with `ws: true` if connecting through port `5173`.
API overview
All routes are mounted by the Express application. The exact request body and response schema should be checked in the relevant files under `src/routes` and `src/controllers`.
Common route groups include:
Area	Route examples	Purpose
Health	`GET /health`	Check whether the API is responding.
Authentication	`/api/auth/...`	Register and log in.
Friends	`/api/friends/...`	Send/manage friend requests and retrieve friends.
Conversations	`/api/conversations/...`	List conversations and retrieve conversation details/messages.
Groups	`/api/groups/...`	Create and manage group conversations.
Messages	`/api/conversations/:conversationId/messages`	Work with conversation messages.
Attachments	`POST /api/conversations/:conversationId/attachments`	Upload an attachment to a conversation.
File access	`GET /api/files/:filename`	Retrieve an uploaded file, subject to authentication and access checks.
Broadcasts	`/api/broadcasts/...`	Admin broadcast functionality.
Authenticated endpoints require the access token in the authorization header unless a route explicitly documents otherwise:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```
For exact endpoint methods, validation rules, and payload formats, inspect `src/routes/`, `src/controllers/`, and the WebSocket handler files.
WebSocket
The WebSocket endpoint is:
```text
ws://localhost:5000/ws
```
The socket supports real-time application events such as message delivery, typing indicators, presence, friend/group updates, and administrative broadcasts. Event names and payload schemas are defined in `src/websocket/`.
Ensure the client sends authentication in the format expected by `src/websocket/` and `src/websocket/websocket.auth.js` (if present). A WebSocket connection that opens but is unauthenticated may be closed by the server.
Attachments
The backend supports image, audio, and PDF uploads through the conversation attachment endpoint.
Endpoint: `POST /api/conversations/:conversationId/attachments`
Maximum file size: 15 MB per file in the current implementation.
Uploaded files are stored on the server in an uploads directory.
Downloads are restricted by authentication and conversation membership checks.
For production deployments, use persistent storage and configure backups/retention for uploaded files. Do not assume uploaded file bytes are end-to-end encrypted unless client-side attachment encryption has been implemented and verified.
Unread messages
Unread counts should be calculated from persisted conversation-member read state, rather than React state or browser storage alone. The backend stores read-position fields such as `lastReadAt` and `lastReadMessageId`, and the conversations API returns an unread count for the signed-in member.
When troubleshooting unread counts:
Confirm the message is saved in MongoDB.
Confirm the conversation member's read-position fields are updated only when that member reads the conversation.
Check the conversations API response for `unreadCount`.
Confirm the frontend refreshes its conversation list after receiving messages and after marking a conversation as read.
Tests
Run the backend test suite:
```powershell
npm test
```
Run tests in watch mode:
```powershell
npm run test:watch
```
Generate test coverage:
```powershell
npm run test:coverage
```
Project structure
```text
chat-api/
├── .env.example
├── package.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── payloads/
│   ├── routes/
│   ├── services/
│   └── websocket/
└── tests/
```
Some folders may contain additional files as the project evolves. Follow the implementation in `src/` as the source of truth for endpoint and event details.
Security checklist
Never commit `.env`, JWT secrets, encryption secrets, or real admin credentials.
Use strong, unique secrets of at least 32 characters.
Use HTTPS/WSS in production.
Restrict `CORS_ORIGIN` to the real frontend origin.
Put the backend behind a properly configured reverse proxy when deploying publicly.
Validate file type and size; do not expose uploads as unrestricted public files.
Back up MongoDB and uploaded files.
Review authorization checks before adding new routes or WebSocket events.
Troubleshooting
`MONGO_URI is required`
Copy `.env.example` to `.env` and set `MONGO_URI`.
Secret validation error
Set `JWT_SECRET` and `KEY_ENCRYPTION_SECRET` to different strong values of at least 32 characters.
Port 5000 is already in use
Stop the other process using port `5000`, or change `PORT` in `.env` and update the frontend's API/WebSocket configuration.
WebSocket closes immediately
Confirm the backend is running, the client uses the `/ws` endpoint, proxy WebSocket upgrades are enabled, and the authentication handshake matches the server implementation.
Unread count resets after refresh
Check that unread counts come from the backend response and that per-member read state is persisted in MongoDB. Avoid initializing unread counts to zero over backend values during frontend startup.
