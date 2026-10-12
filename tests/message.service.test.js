import User from "../src/models/User.js";
import Conversation from "../src/models/Conversation.js";
import ConversationMember from "../src/models/ConversationMember.js";
import Message from "../src/models/Message.js";
import { getMessages } from "../src/services/message.service.js";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "./setup.js";

describe("Message service", () => {
  beforeAll(connectTestDatabase);
  afterEach(clearTestDatabase);
  afterAll(disconnectTestDatabase);

  test("returns messages in chronological order with sender usernames", async () => {
    await User.create([
      { _id: "u1", username: "alice", email: "alice@example.com", passwordHash: "hash" },
      { _id: "u2", username: "bob", email: "bob@example.com", passwordHash: "hash" }
    ]);
    const conversation = await Conversation.create({ type: "DIRECT", createdBy: "u1", directKey: "u1:u2" });
    await ConversationMember.create([
      { conversationId: conversation._id, userId: "u1", role: "MEMBER" },
      { conversationId: conversation._id, userId: "u2", role: "MEMBER" }
    ]);
    await Message.create([
      { conversationId: conversation._id, senderId: "u1", messageType: "text", payloadType: "text", payload: { text: "first" }, createdAt: new Date("2026-01-01T00:00:00Z") },
      { conversationId: conversation._id, senderId: "u2", messageType: "text", payloadType: "text", payload: { text: "second" }, createdAt: new Date("2026-01-01T00:00:01Z") }
    ]);

    const messages = await getMessages("u1", conversation._id.toString());
    expect(messages).toHaveLength(2);
    expect(messages[0].payload.text).toBe("first");
    expect(messages[0].senderUsername).toBe("alice");
    expect(messages[1].senderUsername).toBe("bob");
  });

  test("rejects non-members and invalid conversation IDs", async () => {
    await expect(getMessages("u1", "not-an-id")).rejects.toThrow(/Invalid conversation ID/);
  });
});
