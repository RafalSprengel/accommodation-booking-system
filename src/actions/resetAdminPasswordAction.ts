"use server";

import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";
import mongoose from "mongoose";
import { UsernameReminder } from "@/emails/UsernameReminder";
import { getSiteSettings } from "@/actions/siteSettingsActions";

export async function requestPasswordResetByUsername(username: string) {
    try {
        if (!username || username.trim() === '') {
            return { success: false, error: "Missing username" };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            console.error("No MongoDB connection in password reset action.");
            return { success: false, error: "Server error" };
        }

        const userDoc = await db.collection('user').findOne({ username: username });

        if (!userDoc || !userDoc.email) {
            return { success: false, error: 'Invalid username' };
        }

        const auth = await getAuth();
        if (!auth) {
            return { success: false, error: "Server error" };
        }

        await auth.api.requestPasswordReset({
            body: {
                email: userDoc.email,
                redirectTo: "/reset-password"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error during password reset:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function requestUsernameReminderByEmail(email: string) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            return { success: false, error: "Please provide an email address" };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            console.error("No MongoDB connection in username reminder action.");
            return { success: false, error: "Server error" };
        }

        const userDoc = await db.collection("user").findOne({ email: normalizedEmail });

        if (!userDoc?.username) {
            return { success: true };
        }

        const siteSettings = await getSiteSettings();

        await sendEmail({
            to: normalizedEmail,
            subject: "Username Reminder - Wolf Lodges",
            react: UsernameReminder({ username: userDoc.username, siteSettings }),
        });

        return { success: true };
    } catch (error) {
        console.error("Error sending username reminder:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
