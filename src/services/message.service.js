import mongoose from "mongoose";

import Message from "../models/Message.js";
import ConversationMember from "../models/ConversationMember.js";
import User from "../models/User.js";

import {
    decryptMessageForUser
} from "./encryption.service.js";


const getMessages = async (
    userId,
    conversationId,
    limit = 50,
    before = null
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

    const query = {
        conversationId
    };

    if (before) {
        if (
            !mongoose.Types.ObjectId.isValid(
                before
            )
        ) {
            throw new Error(
                "Invalid message ID"
            );
        }

        const beforeMessage =
            await Message.findById(before);

        if (!beforeMessage) {
            throw new Error(
                "Message not found"
            );
        }

        query.createdAt = {
            $lt: beforeMessage.createdAt
        };
    }

    const messages =
        await Message.find(query)
            .sort({
                createdAt: -1
            })
            .limit(Number(limit));

    const senderIds = [...new Set(messages.map((m) => String(m.senderId)))];
    const senders = await User.find({ _id: { $in: senderIds } }).select("_id username profilePicture").lean();
    const senderMap = new Map(senders.map((u) => [String(u._id), u]));

    const decryptedMessages = [];

    for (
        const message of messages
    ) {
        let payload;

        /*
         * Try to decrypt encrypted messages.
         */
        if (message.payload?.e2eeVersion === 1) {
            // E2EE ciphertext is returned untouched. The browser decrypts it.
            payload = message.payload;
        } else if (message.payload?.encryptedKeys) {
            // Legacy server-encrypted messages remain readable during migration.
            payload = await decryptMessageForUser(message.payload, userId);
        } else {
            payload = message.payload;
        }

        decryptedMessages.push({
            _id: message._id,

            conversationId:
                message.conversationId,

            senderId:
                message.senderId,

            senderUsername: senderMap.get(String(message.senderId))?.username || "Unknown User",
            senderProfilePicture: senderMap.get(String(message.senderId))?.profilePicture || null,

            messageType:
                message.messageType,

            payloadType:
                message.payloadType,

            payload,
            attachment: message.attachment || null,

            createdAt:
                message.createdAt
        });
    }

    /*
     * Messages are retrieved newest-first,
     * so reverse them for the client.
     */
    return decryptedMessages.reverse();
};


export {
    getMessages
};