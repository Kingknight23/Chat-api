import express from "express";

import {
    createFriendRequest,
    incomingFriendRequests,
    acceptFriend,
    rejectFriend,
    friends,
    sendFriendRequestByUsername,
    searchFriends
} from "../controllers/friend.controller.js";

const router = express.Router();


router.post(
    "/requests",
    createFriendRequest
);

router.post(
    "/username/:username",
    sendFriendRequestByUsername
);


router.get(
    "/search",
    searchFriends
);

router.get(
    "/requests/incoming",
    incomingFriendRequests
);


router.post(
    "/requests/:requestId/accept",
    acceptFriend
);


router.post(
    "/requests/:requestId/reject",
    rejectFriend
);


router.get(
    "/",
    friends
);


export default router;