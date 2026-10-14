
import {
  savePublicKey,
  getConversationPublicKeys,
} from "../services/key.service.js";

const publicKey = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { publicKey: clientPublicKey, algorithm } = req.body ?? {};

    if (!clientPublicKey) {
      return res.status(400).json({
        message: "publicKey is required",
      });
    }

    const result = await savePublicKey(
      userId,
      clientPublicKey,
      algorithm
    );

    if (!result?.clientPublicKey) {
      return res.status(500).json({
        message: "Unable to save the public key",
      });
    }

    return res.status(200).json({
      userId,
      publicKey: JSON.parse(result.clientPublicKey),
      algorithm: result.clientAlgorithm,
    });
  } catch (error) {
    next(error);
  }
};

const conversationKeys = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const keys = await getConversationPublicKeys(
      userId,
      req.params.conversationId
    );

    return res.status(200).json({ keys });
  } catch (error) {
    next(error);
  }
};



export { publicKey, conversationKeys };
