import jwt from "jsonwebtoken";

import env from "../config/env.js";

const authenticate = async (
    req,
    res,
    next
) => {
    try {
        const token =
            req.headers.authorization?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            return res.status(401).json({
                message:
                    "Authentication required"
            });
        }

        const decoded =
            jwt.verify(
                token,
                env.jwtSecret
            );

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            roles: [decoded.role]
        };

        next();
    } catch {
        return res.status(401).json({
            message:
                "Invalid or expired token"
        });
    }
};

export default authenticate;