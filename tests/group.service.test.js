import User from "../src/models/User.js";
import FriendRequest from "../src/models/FriendRequest.js";
import ConversationMember from "../src/models/ConversationMember.js";
import Message from "../src/models/Message.js";
import {
  createGroup,
  updateGroup,
  setGroupAdmin,
  removeGroupMember,
  leaveGroup,
  deleteGroup
} from "../src/services/group.service.js";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "./setup.js";

describe("Group service", () => {
  beforeAll(connectTestDatabase);
  afterEach(clearTestDatabase);
  afterAll(disconnectTestDatabase);

  const seedUsers = async () => {
    const users = await User.create([
      { username: "alice", email: "alice@example.com", passwordHash: "hash" },
      { username: "bob", email: "bob@example.com", passwordHash: "hash" },
      { username: "cara", email: "cara@example.com", passwordHash: "hash" },
      { username: "dave", email: "dave@example.com", passwordHash: "hash" }
    ]);
    const ids = users.map((u) => u._id.toString());
    await FriendRequest.create([
      { requesterId: ids[0], recipientId: ids[1], status: "ACCEPTED" },
      { requesterId: ids[0], recipientId: ids[2], status: "ACCEPTED" },
      { requesterId: ids[0], recipientId: ids[3], status: "ACCEPTED" }
    ]);
    return ids;
  };

  test("creates a group with the creator as admin", async () => {
    const ids = await seedUsers();
    const result = await createGroup(ids[0], "Study Group", [ids[1], ids[2]]);
    expect(result.conversation.name).toBe("Study Group");
    expect(result.members).toHaveLength(3);
    expect(result.members.find((m) => m.userId === ids[0]).role).toBe("ADMIN");
  });

  test("requires at least three members and accepted friends", async () => {
    const ids = await seedUsers();
    await expect(createGroup(ids[0], "Too Small", [ids[1]])).rejects.toThrow(/at least 3 users/);
    await expect(createGroup(ids[0], "Friends", [ids[1], ids[3]])).resolves.toBeTruthy();
  });

  test("only admins can update and transfer admin rights", async () => {
    const ids = await seedUsers();
    const { conversation } = await createGroup(ids[0], "Study Group", [ids[1], ids[2]]);
    await expect(updateGroup(ids[1], conversation._id, { name: "Nope" })).rejects.toThrow(/Only group admins/);
    const updated = await updateGroup(ids[0], conversation._id, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    await setGroupAdmin(ids[0], conversation._id, ids[1]);
    const members = await ConversationMember.find({ conversationId: conversation._id }).lean();
    expect(members.find((m) => m.userId === ids[1]).role).toBe("ADMIN");
  });

  test("admin can remove members but cannot remove self through member removal", async () => {
    const ids = await seedUsers();
    const { conversation } = await createGroup(ids[0], "Study Group", [ids[1], ids[2]]);
    await expect(removeGroupMember(ids[0], conversation._id, ids[0])).rejects.toThrow(/leave group/);
    await removeGroupMember(ids[0], conversation._id, ids[2]);
    expect(await ConversationMember.countDocuments({ conversationId: conversation._id })).toBe(2);
  });

  test("admin must transfer role before leaving and deleting removes messages", async () => {
    const ids = await seedUsers();
    const { conversation } = await createGroup(ids[0], "Study Group", [ids[1], ids[2]]);
    await expect(leaveGroup(ids[0], conversation._id)).rejects.toThrow(/transfer admin/);
    await Message.create({ conversationId: conversation._id, senderId: ids[0], messageType: "text", payloadType: "text", payload: { text: "hello" } });
    await deleteGroup(ids[0], conversation._id);
    expect(await Message.countDocuments({ conversationId: conversation._id })).toBe(0);
    expect(await ConversationMember.countDocuments({ conversationId: conversation._id })).toBe(0);
  });
});
