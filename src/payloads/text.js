const validateTextPayload = (payload) => {
    if (!payload || typeof payload !== "object") {
        throw new Error(
            "Text payload must be an object"
        );
    }

    if (
        typeof payload.text !== "string" ||
        payload.text.trim() === ""
    ) {
        throw new Error(
            "Text payload must contain a non-empty text field"
        );
    }

    if (payload.text.length > 5000) {
        throw new Error(
            "Text message cannot exceed 5000 characters"
        );
    }

    return {
        text: payload.text
    };
};


export {
    validateTextPayload
};