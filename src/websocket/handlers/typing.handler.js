import ConversationMember from "../../models/ConversationMember.js";

import {
    sendToUser
} from "../connection.manager.js";


const handleTyping = async (
    socket,
    message,
    isTyping
) => {

    const {
        conversationId
    } = message?.data || message || {};

    if (!conversationId) {
        throw new Error(
            "conversationId is required"
        );
    }

    const member =
        await ConversationMember.findOne({
            conversationId,
            userId:
                socket.user.userId
        });

    if (!member) {
        throw new Error(
            "You are not a member of this conversation"
        );
    }

    const members =
        await ConversationMember.find({
            conversationId
        });

    for (
        const member of members
    ) {

        /*
         * Don't send the typing event
         * back to the person typing.
         */

        if (
            member.userId ===
            socket.user.userId
        ) {
            continue;
        }

        sendToUser(
            member.userId,
            {
                type:
                    isTyping
                        ? "typing.start"
                        : "typing.stop",

                data: {
                    conversationId,

                    userId:
                        socket.user.userId
                }
            }
        );
    }
};


const handleTypingStart = async (
    socket,
    message
) => {

    await handleTyping(
        socket,
        message,
        true
    );
};


const handleTypingStop = async (
    socket,
    message
) => {

    await handleTyping(
        socket,
        message,
        false
    );
};


export {
    handleTypingStart,
    handleTypingStop
};