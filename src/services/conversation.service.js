import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";


const getConversations = async (userId) => {
    const memberships = await ConversationMember.find({
        userId
    }).sort({
        joinedAt: -1
    });

    const conversations = [];

    for (const membership of memberships) {
        const conversation =
            await Conversation.findById(
                membership.conversationId
            );

        if (!conversation) {
            continue;
        }

        const members =
            await ConversationMember.find({
                conversationId: conversation._id
            });

        const lastMessage =
            await Message.findOne({
                conversationId: conversation._id
            }).sort({ createdAt: -1 });
        const unreadQuery = { conversationId: conversation._id, senderId: { $ne: String(userId) } };
        if (membership.lastReadAt) unreadQuery.createdAt = { $gt: membership.lastReadAt };
        const unreadCount = await Message.countDocuments(unreadQuery);

        const allMemberIds = members.map((member) => member.userId);
        const allUsers = await User.find({ _id: { $in: allMemberIds } })
            .select("_id username profilePicture")
            .lean();
        const otherUsers = allUsers.filter((u) => String(u._id) !== String(userId));

        conversations.push({
            ...conversation.toObject(),
            members: members.map((member) => ({ ...member.toObject(), username: allUsers.find((u) => String(u._id) === String(member.userId))?.username || null, profilePicture: allUsers.find((u) => String(u._id) === String(member.userId))?.profilePicture || null })),
            users: otherUsers,
            lastMessage,
            unreadCount
        });
    }

    return conversations;
};


const getConversation = async (
    userId,
    conversationId
) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            conversationId
        )
    ) {
        throw new Error(
            "Invalid conversation ID"
        );
    }

    const member =
        await ConversationMember.findOne({
            conversationId,
            userId
        });

    if (!member) {
        throw new Error(
            "You are not a member of this conversation"
        );
    }

    const conversation =
        await Conversation.findById(
            conversationId
        );

    if (!conversation) {
        throw new Error(
            "Conversation not found"
        );
    }

    const members = await ConversationMember.find({ conversationId }).lean();
    const users = await User.find({ _id: { $in: members.map((m) => m.userId) } }).select("_id username profilePicture").lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    return {
        conversation: { ...conversation.toObject(), members: members.map((m) => ({ ...m, username: userMap.get(String(m.userId))?.username || null, profilePicture: userMap.get(String(m.userId))?.profilePicture || null })), users },
        members
    };
};


const getOrCreateDirectConversation = async (userId, friendId) => {
    if (!friendId || userId === friendId) {
        throw new Error("A different friend is required");
    }

    const friendship = await FriendRequest.findOne({
        status: "ACCEPTED",
        $or: [
            { requesterId: userId, recipientId: friendId },
            { requesterId: friendId, recipientId: userId }
        ]
    });

    if (!friendship) {
        throw new Error("You can only chat with accepted friends");
    }

    const directKey = [userId, friendId].sort().join(":");
    let conversation = await Conversation.findOne({ type: "DIRECT", directKey });

    if (!conversation) {
        conversation = await Conversation.create({
            type: "DIRECT",
            createdBy: userId,
            directKey
        });
        await ConversationMember.create([
            { conversationId: conversation._id, userId, role: "MEMBER" },
            { conversationId: conversation._id, userId: friendId, role: "MEMBER" }
        ]);
    }

    const members = await ConversationMember.find({ conversationId: conversation._id });
    const users = await User.find({ _id: { $in: members.map((member) => member.userId) } })
        .select("_id username profilePicture")
        .lean();
    return { conversation: { ...conversation.toObject(), members, users }, members };
};


export {
    getConversations,
    getConversation,
    getOrCreateDirectConversation
};