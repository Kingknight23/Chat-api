process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chat-api-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-change-me-32-characters";
process.env.KEY_ENCRYPTION_SECRET = process.env.KEY_ENCRYPTION_SECRET || "test-key-encryption-secret-32-chars";
process.env.CORS_ORIGIN = "http://localhost:5173";
