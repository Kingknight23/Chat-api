import {getBroadcasts,getUnreadBroadcastCount} from "../services/broadcast.service.js";

const broadcasts = async (req, res, next) => {
    try {
        const {
            limit = 50,
            before = null
        } = req.query;

        const result = await getBroadcasts(
            limit,
            before
        );

        const unreadCount =
            await getUnreadBroadcastCount(
                req.user.userId
            );

        res.status(200).json({
            broadcasts: result,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
};

export {
    broadcasts
};