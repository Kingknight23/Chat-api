import jwt from "jsonwebtoken";
import env from "../src/config/env.js";

export const makeToken = ({ userId = "100", username = "test-user", role = "USER" } = {}) =>
  jwt.sign({ userId, username, role }, env.jwtSecret, { expiresIn: "1h" });
