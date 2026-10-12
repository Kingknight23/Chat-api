import mongoose from "mongoose";

const broadcastSchema =
    new mongoose.Schema(
        {
            senderId: {
                type: String,
                required: true
            },

            payloadType: {
                type: String,
                required: true
            },

            payload: {
                type: mongoose.Schema.Types.Mixed,
                required: true
            }
        },
        {
            timestamps: true
        }
    );

broadcastSchema.index({
    createdAt: -1
});

const Broadcast =
    mongoose.model(
        "Broadcast",
        broadcastSchema
    );

export default Broadcast;