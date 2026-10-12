import FriendRequest from "../models/FriendRequest.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import {ensureUserKey} from "./encryption.service.js";

import {
    sendToUser
} from "../websocket/connection.manager.js";
import User from "../models/User.js";


const sendFriendRequest = async (
    requesterId,
    recipientId
) => {
    if (!requesterId) {
        throw new Error("Requester ID is required");
    }

    if (!recipientId) {
        throw new Error("Recipient ID is required");
    }

    if (requesterId === recipientId) {
        throw new Error(
            "You cannot send a friend request to yourself"
        );
    }

    /*
     * Check if requester already sent
     * a request to this user.
     */

    const existingRequest = await FriendRequest.findOne({
        requesterId,
        recipientId
    });

    if (existingRequest) {
        if (existingRequest.status === "PENDING") {
            throw new Error(
                "Friend request already exists"
            );
        }

        if (existingRequest.status === "ACCEPTED") {
            throw new Error(
                "You are already friends"
            );
        }

        /*
         * If the previous request was rejected,
         * allow the user to send it again.
         */

        existingRequest.status = "PENDING";

        const request = await existingRequest.save();

        await notifyFriendRequest(
            recipientId,
            request
        );

        return request;
    }

    /*
     * Check whether the other user already
     * sent a request to the requester.
     */

    const reverseRequest = await FriendRequest.findOne({
        requesterId: recipientId,
        recipientId: requesterId,
        status: "PENDING"
    });

    if (reverseRequest) {
        throw new Error(
            "This user has already sent you a friend request"
        );
    }

    /*
     * Create new request.
     */

    const request = await FriendRequest.create({
        requesterId,
        recipientId,
        status: "PENDING"
    });

    /*
     * Real-time notification.
     */

    await notifyFriendRequest(
        recipientId,
        request
    );

    return request;
};


/*
 * Get requests waiting for the
 * currently authenticated user.
 */

const getIncomingRequests = async (
    userId
) => {
    const requests =
        await FriendRequest.find({
            recipientId: userId,
            status: "PENDING"
        })
        .sort({
            createdAt: -1
        })
        .lean();

    const requesterIds =
        requests.map(
            (request) =>
                request.requesterId
        );

    const users =
        await User.find({
            _id: {
                $in: requesterIds
            }
        })
        .select("_id username")
        .lean();

    const usernames = new Map(
        users.map((user) => [
            user._id.toString(),
            user.username
        ])
    );

    return requests.map(
        (request) => ({
            requestId:
                request._id.toString(),

            requesterId:
                request.requesterId,

            requesterUsername:
                usernames.get(
                    request.requesterId
                ) || "Unknown User",

            createdAt:
                request.createdAt
        })
    );
};


/*
 * Accept a friend request.
 */

const acceptFriendRequest = async (
    userId,
    requestId
) => {
    const request = await FriendRequest.findOne({
        _id: requestId,
        recipientId: userId,
        status: "PENDING"
    });

    if (!request) {
        throw new Error(
            "Friend request not found"
        );
    }

    /*
     * Mark request as accepted.
     */

    request.status = "ACCEPTED";

    await request.save();

    const requesterId = request.requesterId;
    const recipientId = request.recipientId;

    await ensureUserKey(
    requesterId
    );

    await ensureUserKey(
        recipientId
    );

    /*
     * Sort IDs so the same two users
     * always produce the same directKey.
     */

    const userIds = [
        requesterId,
        recipientId
    ].sort();

    const directKey = userIds.join(":");

    /*
     * Check whether the direct conversation
     * already exists.
     */

    let conversation = await Conversation.findOne({
        type: "DIRECT",
        directKey
    });

    /*
     * Create conversation if it doesn't exist.
     */

    if (!conversation) {
        conversation = await Conversation.create({
            type: "DIRECT",
            createdBy: requesterId,
            directKey
        });

        await ConversationMember.create([
            {
                conversationId: conversation._id,
                userId: requesterId,
                role: "MEMBER"
            },
            {
                conversationId: conversation._id,
                userId: recipientId,
                role: "MEMBER"
            }
        ]);
    }

    /*
     * Notify requester.
     */

    sendToUser(requesterId, {
        type: "friend.request.accepted",

        data: {
            requestId: request._id,
            userId: recipientId,
            conversationId: conversation._id
        }
    });

    /*
     * Notify recipient.
     */

    sendToUser(recipientId, {
        type: "friend.request.accepted",

        data: {
            requestId: request._id,
            userId: requesterId,
            conversationId: conversation._id
        }
    });

    return {
        request,
        conversation
    };
};


/*
 * Reject a friend request.
 */

const rejectFriendRequest = async (
    userId,
    requestId
) => {
    const request = await FriendRequest.findOne({
        _id: requestId,
        recipientId: userId,
        status: "PENDING"
    });

    if (!request) {
        throw new Error(
            "Friend request not found"
        );
    }

    request.status = "REJECTED";

    await request.save();

    /*
     * Notify the requester.
     */

    sendToUser(request.requesterId, {
        type: "friend.request.rejected",

        data: {
            requestId: request._id
        }
    });

    return request;
};


/*
 * Get all accepted friends.
 */

const getFriends = async (userId) => {
    const requests = await FriendRequest.find({
        status: "ACCEPTED",

        $or: [
            {
                requesterId: userId
            },
            {
                recipientId: userId
            }
        ]
    });

    return requests.map((request) => {
        if (request.requesterId === userId) {
            return request.recipientId;
        }

        return request.requesterId;
    });
};


const searchAcceptedFriends = async (userId, username = "") => {
    const requests = await FriendRequest.find({
        status: "ACCEPTED",
        $or: [{ requesterId: userId }, { recipientId: userId }]
    }).lean();

    const friendIds = requests.map((request) =>
        request.requesterId === userId ? request.recipientId : request.requesterId
    );

    const query = { _id: { $in: friendIds } };
    if (username.trim()) {
        query.username = { $regex: username.trim(), $options: "i" };
    }

    return User.find(query).select("_id username").sort({ username: 1 }).limit(25).lean();
};


/*
 * Send real-time friend request notification.
 */

const notifyFriendRequest = async (
    recipientId,
    request
) => {
    const requester = await User.findById(
        request.requesterId
    ).select("username");

    sendToUser(recipientId, {
        type: "friend.request.received",
        data: {
            requestId: request._id.toString(),
            requesterId: request.requesterId,
            requesterUsername:
                requester?.username || "Unknown User",
            createdAt: request.createdAt
        }
    });
};


export {
    sendFriendRequest,
    getIncomingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    searchAcceptedFriends
};