import {isUserOnline} from "../connection.manager.js";


const handlePresence = async (
    socket,
    message
) => {

    const {
        userId
    } = message.data || {};

    if (!userId) {
        throw new Error(
            "userId is required"
        );
    }

    socket.send(
        JSON.stringify({
            type:
                "presence.status",

            data: {
                userId,

                online:
                    isUserOnline(userId)
            }
        })
    );
};


export {
    handlePresence
};