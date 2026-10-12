import dotenv from "dotenv";
dotenv.config();

const env = {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    keyEncryptionSecret: process.env.KEY_ENCRYPTION_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    adminEmail: process.env.ADMIN_EMAIL,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    trustProxy: String(process.env.TRUST_PROXY || "false").toLowerCase() === "true",
    https: String(process.env.HTTPS || "false").toLowerCase() === "true",
    httpsKeyPath: process.env.HTTPS_KEY_PATH,
    httpsCertPath: process.env.HTTPS_CERT_PATH
};

if (!env.mongoUri) throw new Error("MONGO_URI is required");
if (!env.jwtSecret || env.jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
if (!env.keyEncryptionSecret || env.keyEncryptionSecret.length < 32) throw new Error("KEY_ENCRYPTION_SECRET must be at least 32 characters");

export default env;
