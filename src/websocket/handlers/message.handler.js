import Message from "../../models/Message.js";
import ConversationMember from "../../models/ConversationMember.js";
import { validatePayload } from "../../payloads/registry.js";
import { markMessageDelivered } from "../../services/message-status.service.js";
import { sendToUser } from "../connection.manager.js";
import User from "../../models/User.js";

const handleSendMessage = async (socket, message) => {
    const data = message?.data || message || {};
    const { conversationId, payloadType, payload, attachment = null } = data;

    if (!conversationId) throw new Error("conversationId is required");
    if (!payloadType) throw new Error("payloadType is required");
    if (payload === undefined) throw new Error("payload is required");

    const member = await ConversationMember.findOne({
        conversationId,
        userId: socket.user.userId
    });
    if (!member) throw new Error("You are not a member of this conversation");

    const isE2EE = payload?.e2eeVersion === 1;
    let storedPayload;

    if (isE2EE) {
        if (
            typeof payload.ciphertext !== "string" ||
            typeof payload.iv !== "string" ||
            !payload.encryptedKeys ||
            typeof payload.encryptedKeys !== "object"
        ) {
            throw new Error("Invalid E2EE message payload");
        }
        storedPayload = payload;
    } else {
        // Migration compatibility for old messages/clients.
        storedPayload = validatePayload(payloadType, payload);
    }

    const messageType = payloadType === "text" ? "TEXT"
        : payloadType === "image" ? "IMAGE"
        : payloadType === "audio" ? "AUDIO"
        : payloadType === "file" ? "FILE" : "CUSTOM";

    const sender = await User.findById(socket.user.userId).select("username profilePicture").lean();
    const members = await ConversationMember.find({ conversationId });
    const userIds = members.map((item) => item.userId);

    // IMPORTANT: the server only stores and relays the ciphertext.
    // It never receives or uses the clients' private encryption keys.
    const newMessage = await Message.create({
        conversationId,
        senderId: socket.user.userId,
        messageType,
        payloadType,
        payload: storedPayload,
        attachment
    });

    for (const userId of userIds) {
        sendToUser(userId, {
            type: "message.created",
            data: {
                messageId: newMessage._id,
                conversationId,
                senderId: socket.user.userId,
                senderUsername: sender?.username || socket.user.username,
                senderProfilePicture: sender?.profilePicture || null,
                messageType,
                payloadType,
                payload: storedPayload,
                attachment,
                createdAt: newMessage.createdAt
            }
        });

        if (userId !== socket.user.userId) {
            await markMessageDelivered(userId, newMessage._id);
        }
    }
};

export { handleSendMessage };
