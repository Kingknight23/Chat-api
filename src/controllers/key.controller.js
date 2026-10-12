import { savePublicKey, getConversationPublicKeys } from "../services/key.service.js";

const publicKey = async (req, res, next) => {
    try {
        const result = await savePublicKey(req.user.userId, req.body.publicKey, req.body.algorithm);
        res.status(200).json({ userId: req.user.userId, publicKey: JSON.parse(result.clientPublicKey), algorithm: result.clientAlgorithm });
    } catch (error) { next(error); }
};

const conversationKeys = async (req, res, next) => {
    try {
        const keys = await getConversationPublicKeys(req.user.userId, req.params.conversationId);
        res.status(200).json({ keys });
    } catch (error) { next(error); }
};

export { publicKey, conversationKeys };
