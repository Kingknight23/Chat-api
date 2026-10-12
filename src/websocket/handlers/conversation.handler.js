import ConversationMember from "../../models/ConversationMember.js";

const handleSubscribe = async (socket, message) => {
    const { conversationId } = message.data;

    if (!conversationId) {
        throw new Error("conversationId is required");
    }

    const member = await ConversationMember.findOne({
        conversationId,
        userId: socket.user.userId
    });

    if (!member) {
        throw new Error("You are not a member of this conversation");
    }

    socket.subscriptions.add(conversationId);

    socket.send(
        JSON.stringify({
            type: "conversation.subscribed",
            data: {
                conversationId
            }
        })
    );
};

const handleUnsubscribe = async (socket, message) => {
    const { conversationId } = message.data;

    socket.subscriptions.delete(conversationId);

    socket.send(
        JSON.stringify({
            type: "conversation.unsubscribed",
            data: {
                conversationId
            }
        })
    );
};


export {
    handleSubscribe,
    handleUnsubscribe
};