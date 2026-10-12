import {
    getConversations,
    getConversation,
    getOrCreateDirectConversation
} from "../services/conversation.service.js";
import { markConversationRead as persistConversationRead } from "../services/message-status.service.js";


const conversations = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const result =
            await getConversations(
                userId
            );

        res.status(200).json({
            conversations: result
        });
    } catch (error) {
        next(error);
    }
};


const conversation = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const {
            conversationId
        } = req.params;

        const result =
            await getConversation(
                userId,
                conversationId
            );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


const markRead = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { messageId } = req.body || {};
        if (!messageId) {
            return res.status(400).json({ message: "messageId is required" });
        }
        const member = await persistConversationRead(
            req.user.userId,
            conversationId,
            messageId
        );
        res.status(200).json({
            success: true,
            conversationId,
            lastReadMessageId: member.lastReadMessageId,
            lastReadAt: member.lastReadAt
        });
    } catch (error) {
        next(error);
    }
};

const openDirect = async (req, res, next) => {
    try {
        const result = await getOrCreateDirectConversation(
            req.user.userId,
            req.body.userId
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export {
    conversations,
    conversation,
    openDirect,
    markRead
};