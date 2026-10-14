import ConversationMember from "../models/ConversationMember.js";
import UserKey from "../models/UserKey.js";

const normalizePublicKey = (publicKey) => {
    if (!publicKey) throw new Error("Public key is required");
    if (typeof publicKey === "string") {
        try { return JSON.stringify(JSON.parse(publicKey)); } catch { throw new Error("Public key must be valid JSON"); }
    }
    return JSON.stringify(publicKey);
};


const savePublicKey = async (
  userId,
  publicKey,
  algorithm = "RSA-OAEP-SHA256"
) => {
  const normalized = normalizePublicKey(publicKey);

  // Ensure a database record exists first.
  await ensureUserKey(userId);

  const result = await UserKey.findOneAndUpdate(
    { userId },
    {
      $set: {
        clientPublicKey: normalized,
        clientAlgorithm: algorithm || "RSA-OAEP-SHA256",
      },
    },
    {
      new: true,
      runValidators: true,
      upsert: false,
    }
  );

  if (!result) {
    throw new Error(
      `Could not save public key for user ${userId}`
    );
  }

  return result;
};


const getConversationPublicKeys = async (userId, conversationId) => {
    const member = await ConversationMember.findOne({ conversationId, userId });
    if (!member) throw new Error("You are not a member of this conversation");

    const members = await ConversationMember.find({ conversationId }).lean();
    const ids = members.map((item) => item.userId);
    const keys = await UserKey.find({ userId: { $in: ids } }).select("userId clientPublicKey clientAlgorithm").lean();

    const result = {};
    for (const key of keys) {
        try {
            if (key.clientPublicKey) result[key.userId] = JSON.parse(key.clientPublicKey);
        } catch { /* not registered for browser E2EE */ }
    }

    const missing = ids.filter((id) => !result[id]);
    if (missing.length) {
        throw new Error(`Encryption keys are not registered for: ${missing.join(", ")}`);
    }

    return result;
};

export { savePublicKey, getConversationPublicKeys };
