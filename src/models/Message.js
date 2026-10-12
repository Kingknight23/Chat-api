import mongoose from "mongoose";

const messageSchema =
    new mongoose.Schema(
        {
            conversationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Conversation",
                required: true,
                index: true
            },

            senderId: {
                type: String,
                required: true
            },

            messageType: {
                type: String,
                enum: [
                    "TEXT",
                    "IMAGE",
                    "AUDIO",
                    "FILE",
                    "CUSTOM"
                ],
                default: "TEXT"
            },

            payloadType: {
                type: String,
                required: true
            },

            payload: {
                type: mongoose.Schema.Types.Mixed,
                required: true
            },
            attachment: { type: mongoose.Schema.Types.Mixed, default: null },

            deliveredTo: [
                {
                    userId: {
                        type: String,
                        required: true
                    },

                    deliveredAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ]
        },
        {
            timestamps: true
        }
    );

messageSchema.index({
    conversationId: 1,
    createdAt: -1
});

const Message =
    mongoose.model(
        "Message",
        messageSchema
    );

export default Message;