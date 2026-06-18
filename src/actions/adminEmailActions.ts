"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function changeAdminEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = newEmail.trim().toLowerCase();

    if (!trimmed) {
        return { success: false, error: "Email address cannot be empty." };
    }

    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return { success: false, error: "No active session." };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            return { success: false, error: "Database connection error." };
        }

        const existing = await db.collection("user").findOne({ email: trimmed });
        if (existing && existing._id.toString() !== session.user.id) {
            return { success: false, error: "This email address is already taken." };
        }

        const { ObjectId } = mongoose.Types;
        await db.collection("user").updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { email: trimmed, updatedAt: new Date() } }
        );

        revalidatePath('/admin/settings');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("[changeAdminEmail] error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
