import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";
import { PasswordReset } from "@/emails/PasswordReset";
import { EmailVerification } from "@/emails/EmailVerification";
import { getSiteSettings } from "@/actions/siteSettingsActions";
import { Db } from "mongodb";

function createAuth(db: Db) {
    return betterAuth({
        database: mongodbAdapter(db),
        session: {                        // instead of querying the database on every protected route transition, store the session in a cookie; the database will only be queried every 5 minutes (or when the session changes)
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5  // 5 minutes
            }
        },
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 5,
            sendResetPassword: async ({ url, user }) => {
                const siteSettings = await getSiteSettings();
                await sendEmail({
                    to: user.email,
                subject: "Password Reset - Wolf Lodges",
                    react: PasswordReset({ url, siteSettings })
                });
            }
        },

        user: {
            changeEmail: {
                enabled: true,
            },
            additionalFields: {
                role: {
                    type: "string",
                    required: true,
                    defaultValue: "user",
                    input: true,
                },
                displayUsername: {
                    type: "string",
                    required: false,
                    input: true,
                }
            }
        },

        plugins: [
            username()
        ],

        emailVerification: {
                sendVerificationEmail: async ({ user, url }) => {
                try {
                    await sendEmail({
                        to: user.email,
                subject: "Confirm New Email Address - Wolf Lodges",
                        react: EmailVerification({ url })
                    });
                } catch (err) {
                    console.error('[auth] sendVerificationEmail: send error:', err);
                }
                return;
            }
        },

        secret: process.env.BETTER_AUTH_SECRET,
        trustedOrigins: [
            process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
            "http://192.168.0.80:3000"
        ],
    });
}

type AppAuth = ReturnType<typeof createAuth>;
let _auth: AppAuth | undefined;

export async function getAuth(): Promise<AppAuth> {
    if (_auth) return _auth;

    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection.db is not available after dbConnect()");

    _auth = createAuth(db);

    return _auth;
}
