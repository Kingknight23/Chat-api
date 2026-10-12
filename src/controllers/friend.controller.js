import {
    sendFriendRequest,
    getIncomingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    searchAcceptedFriends
} from "../services/friend.service.js";

import User from "../models/User.js";



const createFriendRequest = async (
    req,
    res,
    next
) => {
    try {
        const requesterId = req.user.userId;

        const {
            userId: recipientId
        } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        const request =
            await sendFriendRequest(
                requesterId,
                recipientId
            );

        res.status(201).json({
            message: "Friend request sent",
            request
        });
    } catch (error) {
        next(error);
    }
};


const incomingFriendRequests = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const requests =
            await getIncomingRequests(
                userId
            );

        res.status(200).json({
            requests
        });
    } catch (error) {
        next(error);
    }
};


const acceptFriend = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const {
            requestId
        } = req.params;

        const result =
            await acceptFriendRequest(
                userId,
                requestId
            );

        res.status(200).json({
            message: "Friend request accepted",

            request: result.request,

            conversationId:
                result.conversation._id
        });
    } catch (error) {
        next(error);
    }
};


const rejectFriend = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const {
            requestId
        } = req.params;

        await rejectFriendRequest(
            userId,
            requestId
        );

        res.status(200).json({
            message: "Friend request rejected"
        });
    } catch (error) {
        next(error);
    }
};


const friends = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user.userId;

        const friendIds =
            await getFriends(userId);

        res.status(200).json({
            friends: friendIds
        });
    } catch (error) {
        next(error);
    }
};

const sendFriendRequestByUsername = async (
    req,
    res,
    next
) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({
            username
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const result =
            await sendFriendRequest(
                req.user.userId,
                user._id.toString()
            );

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};


const searchFriends = async (req, res, next) => {
    try {
        const results = await searchAcceptedFriends(
            req.user.userId,
            req.query.username || ""
        );
        res.status(200).json({
            friends: results.map((user) => ({
                userId: user._id.toString(),
                username: user.username
            }))
        });
    } catch (error) {
        next(error);
    }
};


export {
    createFriendRequest,
    incomingFriendRequests,
    sendFriendRequestByUsername,
    acceptFriend,
    rejectFriend,
    friends,
    searchFriends
};