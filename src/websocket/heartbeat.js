const startHeartbeat = (socket) => {
    socket.isAlive = true;

    socket.on("pong", () => {
        socket.isAlive = true;
    });
};

const startHeartbeatInterval = (webSocketServer) => {
    const interval = setInterval(() => {
        webSocketServer.clients.forEach((socket) => {
            if (socket.isAlive === false) {
                socket.terminate();
                return;
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, 55000);

    webSocketServer.on("close", () => {
        clearInterval(interval);
    });
};

export {
    startHeartbeat,
    startHeartbeatInterval
};