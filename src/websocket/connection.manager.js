import { WebSocket } from "ws";


const connections = new Map();


const addConnection = (
    userId,
    socket
) => {
    if (!connections.has(userId)) {
        connections.set(
            userId,
            new Set()
        );
    }

    connections
        .get(userId)
        .add(socket);
};


const removeConnection = (
    userId,
    socket
) => {
    const userConnections =
        connections.get(userId);

    if (!userConnections) {
        return;
    }

    userConnections.delete(socket);

    if (userConnections.size === 0) {
        connections.delete(userId);
    }
};


const getConnections = (userId) => {
    return (
        connections.get(userId) ||
        new Set()
    );
};


const isUserOnline = (userId) => {
    return connections.has(userId);
};


const sendToUser = (
    userId,
    message
) => {
    const userConnections =
        getConnections(userId);

    for (
        const socket of userConnections
    ) {
        if (
            socket.readyState === WebSocket.OPEN
        ) {
            socket.send(
                JSON.stringify(message)
            );
        }
    }
};


const broadcastToUsers = (
    userIds,
    message
) => {
    for (
        const userId of userIds
    ) {
        sendToUser(
            userId,
            message
        );
    }
};

const broadcastToAll = (
    message
) => {

    for (
        const userId
        of connections.keys()
    ) {

        sendToUser(
            userId,
            message
        );
    }
};

const getOnlineUserIds = () => {
    return [
        ...connections.keys()
    ];
};


export {
    addConnection,
    removeConnection,
    getConnections,
    isUserOnline,
    getOnlineUserIds,
    sendToUser,
    broadcastToUsers,
    broadcastToAll
};