import mongoose from "mongoose";

const broadcastReadSchema = new mongoose.Schema(
    {
        broadcastId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Broadcast",
            required: true
        },
        userId: {
            type: String,
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }
);

broadcastReadSchema.index(
    { broadcastId: 1, userId: 1 },
    { unique: true }
);

broadcastReadSchema.index({
    userId: 1,
    readAt: -1
});

const BroadcastRead = mongoose.model(
    "BroadcastRead",
    broadcastReadSchema
);

export default BroadcastRead;