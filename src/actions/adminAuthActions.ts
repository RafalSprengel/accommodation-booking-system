import User from "@/db/models/Users"
import { randomBytes } from "node:crypto";
import dbConnect from "@/db/connection"

export async function resetAdminPassword(username: string) {
    await dbConnect();

    function generatePassword(length = 6) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const bytes = randomBytes(length);
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }
        return result;
    }

    const user = await User.findOne({ username });
    if (!user) {
        return {
            success: false,
            error: "User not found"
        }
    }

    const password = generatePassword()
    user.password = password;
    try {
        await user.save();

        return {
            success: true,
            message: "Password has been reset"
        }
    } catch (_error) {
        return {
            success: false,
            error: "An error occurred. Please try again."
        }
    }
}