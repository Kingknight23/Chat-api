import bcrypt from "bcrypt";
import User from "../models/User.js";

const getProfile = async (userId) => User.findById(userId).select("_id username email role profilePicture createdAt").lean();

const updateProfile = async (userId, body) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    if (body.username !== undefined) {
        const username = String(body.username).trim();
        if (username.length < 3 || username.length > 30) throw new Error("Username must be 3-30 characters");
        const existing = await User.findOne({ username, _id: { $ne: userId } });
        if (existing) throw new Error("Username is already in use");
        user.username = username;
    }
    if (body.email !== undefined) {
        const email = String(body.email).trim().toLowerCase();
        const existing = await User.findOne({ email, _id: { $ne: userId } });
        if (existing) throw new Error("Email is already in use");
        user.email = email;
    }
    if (body.profilePicture !== undefined) {
        if (body.profilePicture && body.profilePicture.length > 2_500_000) throw new Error("Profile picture is too large");
        user.profilePicture = body.profilePicture || null;
    }
    if (body.password) {
        if (String(body.password).length < 8) throw new Error("Password must be at least 8 characters");
        user.passwordHash = await bcrypt.hash(body.password, 12);
    }
    await user.save();
    return getProfile(userId);
};

export { getProfile, updateProfile };
