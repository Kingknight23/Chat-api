import bcrypt from "bcrypt";

import User from "../models/User.js";
import env from "./env.js";

const seedAdmin = async () => {
    let admin = await User.findOne({
        role: "ADMIN"
    });

    if (admin) {
        return admin;
    }

    const passwordHash =
        await bcrypt.hash(
            env.adminPassword,
            12
        );

    admin = await User.create({
        username:
            env.adminUsername,

        email:
            env.adminEmail,

        passwordHash,

        role: "ADMIN"
    });

    console.log(
        "Admin account created:",
        admin.email
    );

    return admin;
};

export default seedAdmin;