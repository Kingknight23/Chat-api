import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["DIRECT", "GROUP", "BROADCAST"],
            required: true
        },

        name: {
            type: String,
            default: null
        },

        createdBy: {
            type: String,
            required: true
        },

        profilePicture: {
            type: String,
            default: null
        },

        directKey: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index(
    { type: 1, directKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: "DIRECT"
        }
    }
);

const Conversation = mongoose.model(
    "Conversation",
    conversationSchema
);

export default Conversation;