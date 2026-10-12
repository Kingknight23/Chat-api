import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
    {
        requesterId: {
            type: String,
            required: true
        },

        recipientId: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

friendRequestSchema.index(
    {
        requesterId: 1,
        recipientId: 1
    },
    {
        unique: true
    }
);

friendRequestSchema.index({
    recipientId: 1,
    status: 1
});

const FriendRequest = mongoose.model(
    "FriendRequest",
    friendRequestSchema
);

export default FriendRequest;