import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import env from "../config/env.js";

const createAuthError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
            username: user.username
        },
        env.jwtSecret,
        {
            expiresIn: "7d"
        }
    );
};

const registerUser = async (
    username,
    email,
    password
) => {
    if (!username || !email || !password) {
        throw createAuthError(
            "Username, email and password are required",
            400
        );
    }

    if (password.length < 8) {
        throw createAuthError(
            "Password must be at least 8 characters",
            400
        );
    }

    const existingUser = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { username }
        ]
    });

    if (existingUser) {
        throw createAuthError(
            "Username or email is already registered",
            409
        );
    }

    const passwordHash = await bcrypt.hash(
        password,
        12
    );

    const user = await User.create({
        username,
        email: email.toLowerCase(),
        passwordHash,
        role: "USER"
    });


    const token = generateToken(user);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture || null
        },
        token
    };
};

const loginUser = async (
    email,
    password
) => {
    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw createAuthError(
            "Invalid email or password",
            401
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            password,
            user.passwordHash
        );

    if (!passwordMatches) {
        throw createAuthError(
            "Invalid email or password",
            401
        );
    }

    const token = generateToken(user);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture || null
        },
        token
    };
};

export {
    registerUser,
    loginUser,
    generateToken
};