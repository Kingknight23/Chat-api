import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { sendToUser } from "../websocket/connection.manager.js";

const hydrateGroup = async (conversation) => {
    const members = await ConversationMember.find({ conversationId: conversation._id }).lean();
    const users = await User.find({ _id: { $in: members.map(m => m.userId) } })
        .select("_id username profilePicture")
        .lean();
    const byId = new Map(users.map(u => [u._id.toString(), u]));
    return {
        ...conversation.toObject(),
        members: members.map(m => ({ ...m, username: byId.get(String(m.userId))?.username || "Unknown User", profilePicture: byId.get(String(m.userId))?.profilePicture || null })),
        users
    };
};

const requireAdmin = async (requesterId, conversationId) => {
    const admin = await ConversationMember.findOne({ conversationId, userId: requesterId, role: "ADMIN" });
    if (!admin) throw new Error("Only group admins can perform this action");
    return admin;
};

const ensureGroup = async (conversationId) => {
    const conversation = await Conversation.findOne({ _id: conversationId, type: "GROUP" });
    if (!conversation) throw new Error("Group not found");
    return conversation;
};

const notifyMembers = async (conversationId, type, data) => {
    const members = await ConversationMember.find({ conversationId }).lean();
    for (const member of members) sendToUser(member.userId, { type, data: { conversationId, ...data } });
};

const createGroup = async (creatorId, name, userIds, profilePicture = null) => {
    if (!name?.trim()) throw new Error("Group name is required");
    if (!Array.isArray(userIds)) throw new Error("userIds must be an array");
    const memberIds = [...new Set([creatorId, ...userIds.map(String)])];
    if (memberIds.length < 3) throw new Error("A group must contain at least 3 users");
    if (profilePicture && profilePicture.length > 2_500_000) throw new Error("Group profile picture is too large");

    const friends = await FriendRequest.find({ status: "ACCEPTED", $or: [{ requesterId: creatorId }, { recipientId: creatorId }] }).lean();
    const friendIds = new Set(friends.map(f => f.requesterId === creatorId ? f.recipientId : f.requesterId));
    if (memberIds.some(id => id !== creatorId && !friendIds.has(id))) throw new Error("Groups can only include accepted friends");

    const conversation = await Conversation.create({ type: "GROUP", name: name.trim(), createdBy: creatorId, profilePicture: profilePicture || null });
    await ConversationMember.insertMany(memberIds.map(userId => ({ conversationId: conversation._id, userId, role: userId === creatorId ? "ADMIN" : "MEMBER" })));
    const hydrated = await hydrateGroup(conversation);
    await notifyMembers(conversation._id, "group.created", { conversation: hydrated });
    return { conversation: hydrated, members: hydrated.members };
};

const updateGroup = async (requesterId, conversationId, { name, profilePicture }) => {
    await requireAdmin(requesterId, conversationId);
    const conversation = await ensureGroup(conversationId);
    if (name !== undefined) {
        if (!String(name).trim()) throw new Error("Group name is required");
        conversation.name = String(name).trim();
    }
    if (profilePicture !== undefined) {
        if (profilePicture && profilePicture.length > 2_500_000) throw new Error("Group profile picture is too large");
        conversation.profilePicture = profilePicture || null;
    }
    await conversation.save();
    const hydrated = await hydrateGroup(conversation);
    await notifyMembers(conversationId, "group.updated", { conversation: hydrated });
    return hydrated;
};

const deleteGroup = async (requesterId, conversationId) => {
    await requireAdmin(requesterId, conversationId);
    await ensureGroup(conversationId);
    const members = await ConversationMember.find({ conversationId }).lean();
    for (const member of members) sendToUser(member.userId, { type: "group.deleted", data: { conversationId } });
    await Message.deleteMany({ conversationId });
    await ConversationMember.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });
    return true;
};

const addGroupMember = async (requesterId, conversationId, userId) => {
    await requireAdmin(requesterId, conversationId);
    await ensureGroup(conversationId);
    const friendship = await FriendRequest.findOne({ status: "ACCEPTED", $or: [{ requesterId: requesterId, recipientId: userId }, { requesterId: userId, recipientId: requesterId }] });
    if (!friendship) throw new Error("You can only add accepted friends");
    if (await ConversationMember.findOne({ conversationId, userId })) throw new Error("User is already a member of this group");
    const member = await ConversationMember.create({ conversationId, userId, role: "MEMBER" });
    const hydrated = await hydrateGroup(await Conversation.findById(conversationId));
    await notifyMembers(conversationId, "group.updated", { conversation: hydrated, action: "member.added", userId });
    return member;
};

const removeGroupMember = async (requesterId, conversationId, userId) => {
    await requireAdmin(requesterId, conversationId);
    if (requesterId === userId) throw new Error("Use leave group to remove yourself");
    const member = await ConversationMember.findOne({ conversationId, userId });
    if (!member) throw new Error("User is not a member of this group");
    await ConversationMember.deleteOne({ _id: member._id });
    await notifyMembers(conversationId, "group.updated", { action: "member.removed", userId });
    sendToUser(userId, { type: "group.member.removed", data: { conversationId, userId, removedBy: requesterId } });
    return true;
};

const setGroupAdmin = async (requesterId, conversationId, userId) => {
    await requireAdmin(requesterId, conversationId);
    const member = await ConversationMember.findOne({ conversationId, userId });
    if (!member) throw new Error("User is not a member of this group");
    member.role = "ADMIN";
    await member.save();
    const hydrated = await hydrateGroup(await Conversation.findById(conversationId));
    await notifyMembers(conversationId, "group.updated", { conversation: hydrated, action: "admin.changed", userId });
    return hydrated;
};

const leaveGroup = async (userId, conversationId) => {
    const member = await ConversationMember.findOne({ conversationId, userId });
    if (!member) throw new Error("You are not a member of this group");
    if (member.role === "ADMIN") throw new Error("Group admin must transfer admin role before leaving");
    const count = await ConversationMember.countDocuments({ conversationId });
    if (count <= 3) throw new Error("A group must contain at least 3 users");
    await ConversationMember.deleteOne({ _id: member._id });
    await notifyMembers(conversationId, "group.updated", { action: "member.left", userId });
    return true;
};

export { createGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember, setGroupAdmin, leaveGroup, hydrateGroup };
