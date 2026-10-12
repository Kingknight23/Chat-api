import mongoose from "mongoose";

import Message from "../models/Message.js";
import ConversationMember from "../models/ConversationMember.js";

import {
    sendToUser
} from "../websocket/connection.manager.js";


const markMessageDelivered = async (
    userId,
    messageId
) => {

    if (
        !mongoose.Types.ObjectId.isValid(
            messageId
        )
    ) {
        throw new Error(
            "Invalid message ID"
        );
    }

    const message =
        await Message.findById(
            messageId
        );

    if (!message) {
        throw new Error(
            "Message not found"
        );
    }

    const member =
        await ConversationMember.findOne({
            conversationId:
                message.conversationId,
            userId
        });

    if (!member) {
        throw new Error(
            "You are not a member of this conversation"
        );
    }

    if (
        message.senderId === userId
    ) {
        return message;
    }

    const alreadyDelivered =
        message.deliveredTo.some(
            (entry) =>
                entry.userId === userId
        );

    if (!alreadyDelivered) {

        message.deliveredTo.push({
            userId,
            deliveredAt: new Date()
        });

        await message.save();
    }

    /*
     * Tell the sender that their
     * message was delivered.
     */

    sendToUser(
        message.senderId,
        {
            type:
                "message.delivered",

            data: {
                messageId:
                    message._id,

                conversationId:
                    message.conversationId,

                userId,

                deliveredAt:
                    new Date()
            }
        }
    );

    return message;
};


const markConversationRead = async (
    userId,
    conversationId,
    messageId
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

    if (
        !mongoose.Types.ObjectId.isValid(
            messageId
        )
    ) {
        throw new Error(
            "Invalid message ID"
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

    const message =
        await Message.findOne({
            _id: messageId,
            conversationId
        });

    if (!message) {
        throw new Error(
            "Message does not belong to this conversation"
        );
    }

    member.lastReadMessageId =
        message._id;

    // Store the timestamp of the message actually read, not the current time.
    // This avoids accidentally marking messages sent concurrently as read.
    const messageReadAt = message.createdAt || new Date();
    if (!member.lastReadAt || new Date(member.lastReadAt) < new Date(messageReadAt)) {
        member.lastReadAt = messageReadAt;
    }

    await member.save();

    /*
     * Tell the sender that the
     * message has been read.
     */

    if (
        message.senderId !== userId
    ) {

        sendToUser(
            message.senderId,
            {
                type:
                    "message.read",

                data: {
                    messageId:
                        message._id,

                    conversationId,

                    userId,

                    readAt:
                        member.lastReadAt
                }
            }
        );
    }

    return member;
};


export {
    markMessageDelivered,
    markConversationRead
};