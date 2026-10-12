const MAX_IMAGE_STRING_LENGTH = 2_500_000;
const ALLOWED_DATA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const validateImagePayload = (payload) => {
    if (!payload || typeof payload !== "object") {
        throw new Error("Image payload must be an object");
    }

    if (typeof payload.url !== "string" || payload.url.trim() === "") {
        throw new Error("Image payload must contain a url");
    }

    if (payload.url.length > MAX_IMAGE_STRING_LENGTH) {
        throw new Error("Image payload is too large");
    }

    if (payload.url.startsWith("data:")) {
        const match = payload.url.match(/^data:([^;,]+)[;,]/i);
        if (!match || !ALLOWED_DATA_TYPES.has(match[1].toLowerCase())) {
            throw new Error("Unsupported image type");
        }
    }

    return {
        url: payload.url,
        width: Number.isFinite(Number(payload.width)) ? Number(payload.width) : null,
        height: Number.isFinite(Number(payload.height)) ? Number(payload.height) : null
    };
};

export { validateImagePayload };
