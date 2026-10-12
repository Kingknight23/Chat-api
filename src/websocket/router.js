import {handleSendMessage} from "./handlers/message.handler.js";
import {handleSubscribe,handleUnsubscribe} from "./handlers/conversation.handler.js";
import {handlePresence} from "./handlers/presence.handler.js";
import {handleMarkRead} from "./handlers/read.handler.js";
import {handleTypingStart,handleTypingStop} from "./handlers/typing.handler.js";
import {handleAdminBroadcast} from "./handlers/admin.handler.js";
import {handleBroadcastRead} from "./handlers/broadcast.handler.js";

const routeMessage = async (socket, message) => {
    try {
        console.log(
            "WebSocket event received:",
            message.type
        );

        switch (message.type) {
            case "message.send":
                await handleSendMessage(socket, message);
                break;

            case "conversation.subscribe":
                await handleSubscribe(socket, message);
                break;

            case "conversation.unsubscribe":
                await handleUnsubscribe(socket, message);
                break;

            case "presence.update":
                await handlePresence(socket, message);
                break;
            case "message.read":
                await handleMarkRead(socket,message);
                break;

            case "typing.start":
                await handleTypingStart(socket,message);
                break;

            case "typing.stop":
                await handleTypingStop(socket,message);
                break;

            case "admin.broadcast":
                await handleAdminBroadcast(socket,message);

                break;
            case "admin.broadcast.read":
                await handleBroadcastRead(socket, message);
                break;

            default:
                socket.send(
                    JSON.stringify({
                        type: "error",
                        data: {
                            message: "Unknown WebSocket event"
                        }
                    })
                );
        }
    } catch (error) {
        console.error(error);

        socket.send(
            JSON.stringify({
                type: "error",
                data: {
                    message: error.message
                }
            })
        );
    }
};

export default routeMessage;