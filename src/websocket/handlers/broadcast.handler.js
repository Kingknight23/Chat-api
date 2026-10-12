import {markBroadcastRead} from "../../services/broadcast.service.js";

const handleBroadcastRead = async (
    socket,
    message
) => {
    const { broadcastId } = message.data || {};

    if (!broadcastId) {
        throw new Error("broadcastId is required");
    }

    await markBroadcastRead(
        socket.user.userId,
        broadcastId
    );

    socket.send(JSON.stringify({
        type: "admin.broadcast.read.confirmed",
        data: {
            broadcastId
        }
    }));
};

export {
    handleBroadcastRead
};