import {
    markConversationRead
} from "../../services/message-status.service.js";


const handleMarkRead = async (
    socket,
    message
) => {

    const {
        conversationId,
        messageId
    } = message.data || {};

    if (!conversationId) {
        throw new Error(
            "conversationId is required"
        );
    }

    if (!messageId) {
        throw new Error(
            "messageId is required"
        );
    }


    await markConversationRead(
        socket.user.userId,
        conversationId,
        messageId
    );


    /*
     * Confirm to the user that
     * their read state was saved.
     */

    socket.send(
        JSON.stringify({
            type:
                "message.read.confirmed",

            data: {
                conversationId,
                messageId
            }
        })
    );
};


export {
    handleMarkRead
};