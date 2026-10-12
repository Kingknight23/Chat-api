import mongoose from "mongoose";

const conversationMemberSchema =
    new mongoose.Schema(
        {
            conversationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Conversation",
                required: true
            },

            userId: {
                type: String,
                required: true
            },

            role: {
                type: String,
                enum: [
                    "MEMBER",
                    "ADMIN"
                ],
                default: "MEMBER"
            },

            joinedAt: {
                type: Date,
                default: Date.now
            },

            lastReadMessageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
                default: null
            },

            lastReadAt: {
                type: Date,
                default: null
            }
        }
    );

conversationMemberSchema.index(
    {
        conversationId: 1,
        userId: 1
    },
    {
        unique: true
    }
);

const ConversationMember =
    mongoose.model(
        "ConversationMember",
        conversationMemberSchema
    );

export default ConversationMember;