import Broadcast from "../models/Broadcast.js";
import BroadcastRead from "../models/BroadcastRead.js";
import { sendToUser } from "../websocket/connection.manager.js";

const getBroadcasts = async (limit = 50, before = null) => {
    const query = {};

    if (before) {
        const beforeBroadcast = await Broadcast.findById(before);

        if (!beforeBroadcast) {
            throw new Error("Broadcast not found");
        }

        query.createdAt = {
            $lt: beforeBroadcast.createdAt
        };
    }

    const broadcasts = await Broadcast.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

    return broadcasts.reverse();
};

const getUnreadBroadcasts = async (
    userId,
    limit = 20
) => {
    const broadcasts = await Broadcast.find()
        .sort({ createdAt: -1 })
        .limit(Number(limit));

    const broadcastIds = broadcasts.map(
        (broadcast) => broadcast._id
    );

    const readBroadcasts = await BroadcastRead.find({
        userId,
        broadcastId: {
            $in: broadcastIds
        }
    });

    const readIds = new Set(
        readBroadcasts.map(
            (read) => read.broadcastId.toString()
        )
    );

    return broadcasts
        .filter(
            (broadcast) =>
                !readIds.has(broadcast._id.toString())
        )
        .reverse();
};

const getUnreadBroadcastCount = async (userId) => {
    const broadcasts = await Broadcast.find()
        .select("_id");

    if (broadcasts.length === 0) {
        return 0;
    }

    const broadcastIds = broadcasts.map(
        (broadcast) => broadcast._id
    );

    const readCount = await BroadcastRead.countDocuments({
        userId,
        broadcastId: {
            $in: broadcastIds
        }
    });

    return broadcasts.length - readCount;
};

const sendRecentBroadcasts = async (userId) => {
    const broadcasts = await getUnreadBroadcasts(
        userId,
        20
    );

    const unreadCount =
        await getUnreadBroadcastCount(userId);

    for (const broadcast of broadcasts) {
        sendToUser(userId, {
            type: "admin.broadcast",
            data: {
                broadcastId: broadcast._id,
                payloadType: broadcast.payloadType,
                payload: broadcast.payload,
                sentBy: broadcast.senderId,
                createdAt: broadcast.createdAt,
                unreadCount
            }
        });
    }
};

const markBroadcastRead = async (
    userId,
    broadcastId
) => {
    const broadcast = await Broadcast.findById(
        broadcastId
    );

    if (!broadcast) {
        throw new Error("Broadcast not found");
    }

    try {
        await BroadcastRead.create({
            broadcastId,
            userId
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }
    }

    return true;
};

export {
    getBroadcasts,
    getUnreadBroadcasts,
    getUnreadBroadcastCount,
    sendRecentBroadcasts,
    markBroadcastRead
};