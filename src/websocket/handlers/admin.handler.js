import Broadcast from "../../models/Broadcast.js";

import {getUnreadBroadcastCount} from "../../services/broadcast.service.js";

import {sendToUser,getOnlineUserIds} from "../connection.manager.js";

const handleAdminBroadcast = async (
    socket,
    message
) => {
    if (
        !socket.user.roles ||
        !socket.user.roles.includes("ADMIN")
    ) {
        throw new Error("Admin permission required");
    }

    const {
        payloadType,
        payload
    } = message.data || {};

    if (!payloadType) {
        throw new Error(
            "payloadType is required"
        );
    }

    if (payload === undefined) {
        throw new Error(
            "payload is required"
        );
    }

    const broadcast = await Broadcast.create({
        senderId: socket.user.userId,
        payloadType,
        payload
    });

    const onlineUserIds =
        getOnlineUserIds();

    for (const userId of onlineUserIds) {
        const unreadCount =
            await getUnreadBroadcastCount(
                userId
            );

        sendToUser(userId, {
            type: "admin.broadcast",
            data: {
                broadcastId: broadcast._id,
                payloadType,
                payload,
                sentBy: socket.user.userId,
                createdAt: broadcast.createdAt,
                unreadCount
            }
        });
    }

    socket.send(JSON.stringify({
        type: "admin.broadcast.confirmed",
        data: {
            broadcastId: broadcast._id,
            createdAt: broadcast.createdAt
        }
    }));
};

export {
    handleAdminBroadcast
};