import {
    randomBytes,
    generateKeyPairSync,
    publicEncrypt,
    privateDecrypt,
    createCipheriv,
    createDecipheriv,
    createHash,
    constants
} from "crypto";

import UserKey from "../models/UserKey.js";

import env from "../config/env.js";


/*
 * Convert the application secret into
 * a 32-byte AES key.
 */
const getMasterKey = () => {
    if (!env.keyEncryptionSecret) {
        throw new Error(
            "KEY_ENCRYPTION_SECRET is not configured"
        );
    }

    return createHash("sha256")
        .update(env.keyEncryptionSecret)
        .digest();
};


/*
 * Encrypt a user's private RSA key
 * before storing it in MongoDB.
 */
const encryptPrivateKey = (
    privateKey
) => {
    const key = getMasterKey();

    const iv = randomBytes(12);

    const cipher = createCipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    const encrypted =
        Buffer.concat([
            cipher.update(
                privateKey,
                "utf8"
            ),
            cipher.final()
        ]);

    const authTag =
        cipher.getAuthTag();

    return {
        encryptedPrivateKey:
            encrypted.toString("base64"),

        privateKeyIv:
            iv.toString("base64"),

        privateKeyAuthTag:
            authTag.toString("base64")
    };
};


/*
 * Decrypt a user's private RSA key.
 */
const decryptPrivateKey = (
    userKey
) => {
    const key = getMasterKey();

    const iv = Buffer.from(
        userKey.privateKeyIv,
        "base64"
    );

    const authTag = Buffer.from(
        userKey.privateKeyAuthTag,
        "base64"
    );

    const encrypted =
        Buffer.from(
            userKey.encryptedPrivateKey,
            "base64"
        );

    const decipher =
        createDecipheriv(
            "aes-256-gcm",
            key,
            iv
        );

    decipher.setAuthTag(
        authTag
    );

    const decrypted =
        Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

    return decrypted.toString("utf8");
};


/*
 * Generate a new RSA key pair.
 */
const generateUserKeyPair = () => {
    const {
        publicKey,
        privateKey
    } = generateKeyPairSync(
        "rsa",
        {
            modulusLength: 3072,

            publicKeyEncoding: {
                type: "spki",
                format: "pem"
            },

            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem"
            }
        }
    );

    return {
        publicKey,
        privateKey
    };
};


/*
 * Make sure a user has an RSA key pair.
 */
const ensureUserKey = async (
    userId
) => {
    let userKey =
        await UserKey.findOne({
            userId
        });

    if (userKey) {
        return userKey;
    }

    const {
        publicKey,
        privateKey
    } = generateUserKeyPair();

    const encrypted =
        encryptPrivateKey(
            privateKey
        );

    try {
        userKey =
            await UserKey.create({
                userId,

                publicKey,

                encryptedPrivateKey:
                    encrypted.encryptedPrivateKey,

                privateKeyIv:
                    encrypted.privateKeyIv,

                privateKeyAuthTag:
                    encrypted.privateKeyAuthTag,

                algorithm:
                    "RSA-OAEP"
            });

        return userKey;
    } catch (error) {
        /*
         * Another request may have created
         * the key at the same time.
         */
        if (error.code === 11000) {
            return UserKey.findOne({
                userId
            });
        }

        throw error;
    }
};


/*
 * Encrypt a plaintext message using
 * AES-256-GCM.
 */
const encryptPayload = (
    payload
) => {
    const aesKey =
        randomBytes(32);

    const iv =
        randomBytes(12);

    const plaintext =
        JSON.stringify(payload);

    const cipher =
        createCipheriv(
            "aes-256-gcm",
            aesKey,
            iv
        );

    const ciphertext =
        Buffer.concat([
            cipher.update(
                plaintext,
                "utf8"
            ),
            cipher.final()
        ]);

    const authTag =
        cipher.getAuthTag();

    return {
        aesKey,

        ciphertext:
            ciphertext.toString(
                "base64"
            ),

        iv:
            iv.toString("base64"),

        authTag:
            authTag.toString("base64")
    };
};


/*
 * Encrypt the AES key using
 * a user's RSA public key.
 */
const encryptAesKeyForUser = (
    aesKey,
    publicKey
) => {
    const encryptedKey =
        publicEncrypt(
            {
                key: publicKey,

                padding:
                    constants.RSA_PKCS1_OAEP_PADDING,

                oaepHash: "sha256"
            },

            aesKey
        );

    return encryptedKey.toString(
        "base64"
    );
};


/*
 * Encrypt a message for multiple users.
 */
const encryptMessageForUsers = async (
    payload,
    userIds
) => {
    const encrypted =
        encryptPayload(
            payload
        );

    const encryptedKeys = [];

    for (
        const userId of userIds
    ) {
        const userKey =
            await ensureUserKey(
                userId
            );

        const encryptedKey =
            encryptAesKeyForUser(
                encrypted.aesKey,
                userKey.publicKey
            );

        encryptedKeys.push({
            userId,
            encryptedKey
        });
    }

    return {
        algorithm:
            "AES-256-GCM",

        keyAlgorithm:
            "RSA-OAEP",

        ciphertext:
            encrypted.ciphertext,

        iv:
            encrypted.iv,

        authTag:
            encrypted.authTag,

        encryptedKeys
    };
};


/*
 * Decrypt an encrypted message
 * for one specific user.
 */
const decryptMessageForUser = async (
    encryptedPayload,
    userId
) => {
    const keyEntry =
        encryptedPayload.encryptedKeys
            .find(
                (entry) =>
                    entry.userId === userId
            );

    if (!keyEntry) {
        throw new Error(
            "No encrypted message key exists for this user"
        );
    }

    const userKey =
        await UserKey.findOne({
            userId
        });

    if (!userKey) {
        throw new Error(
            "User encryption key not found"
        );
    }

    const privateKey =
        decryptPrivateKey(
            userKey
        );

    const aesKey =
        privateDecrypt(
            {
                key: privateKey,

                padding:
                   constants.RSA_PKCS1_OAEP_PADDING,

                oaepHash: "sha256"
            },

            Buffer.from(
                keyEntry.encryptedKey,
                "base64"
            )
        );

    const decipher =
        createDecipheriv(
            "aes-256-gcm",
            aesKey,

            Buffer.from(
                encryptedPayload.iv,
                "base64"
            )
        );

    decipher.setAuthTag(
        Buffer.from(
            encryptedPayload.authTag,
            "base64"
        )
    );

    const decrypted =
        Buffer.concat([
            decipher.update(
                Buffer.from(
                    encryptedPayload.ciphertext,
                    "base64"
                )
            ),

            decipher.final()
        ]);

    return JSON.parse(
        decrypted.toString("utf8")
    );
};


export {
    ensureUserKey,
    encryptMessageForUsers,
    decryptMessageForUser
};