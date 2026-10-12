import {
    validateTextPayload
} from "./text.js";

import {
    validateImagePayload
} from "./image.js";


const payloadRegistry = {
    text: validateTextPayload,
    image: validateImagePayload
};


const validatePayload = (
    payloadType,
    payload
) => {
    const validator =
        payloadRegistry[payloadType];

    if (!validator) {
        throw new Error(
            `Unsupported payload type: ${payloadType}`
        );
    }

    return validator(payload);
};


const registerPayloadType = (
    payloadType,
    validator
) => {
    if (
        typeof payloadType !== "string" ||
        payloadType.trim() === ""
    ) {
        throw new Error(
            "Payload type is required"
        );
    }

    if (typeof validator !== "function") {
        throw new Error(
            "Payload validator must be a function"
        );
    }

    payloadRegistry[payloadType] =
        validator;
};


export {
    validatePayload,
    registerPayloadType
};