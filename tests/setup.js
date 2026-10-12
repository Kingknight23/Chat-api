import mongoose from "mongoose";
import {
    MongoMemoryServer
} from "mongodb-memory-server";

let mongoServer;

const connectTestDatabase = async () => {
    mongoServer =
        await MongoMemoryServer.create();

    const mongoUri =
        mongoServer.getUri();

    await mongoose.connect(
        mongoUri
    );
};

const disconnectTestDatabase =
    async () => {
        await mongoose.connection.dropDatabase();

        await mongoose.disconnect();

        if (mongoServer) {
            await mongoServer.stop();
        }
    };

const clearTestDatabase =
    async () => {
        const collections =
            mongoose.connection.collections;

        for (const key of Object.keys(collections)) {
            await collections[key].deleteMany({});
        }
    };

export {
    connectTestDatabase,
    disconnectTestDatabase,
    clearTestDatabase
};