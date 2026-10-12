import {
    getMessages
} from "../services/message.service.js";


const messages = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const {
            conversationId
        } = req.params;

        const {
            limit = 50,
            before = null
        } = req.query;

        const result =
            await getMessages(
                userId,
                conversationId,
                limit,
                before
            );

        res.status(200).json({
            messages: result
        });
    } catch (error) {
        next(error);
    }
};


export {
    messages
};