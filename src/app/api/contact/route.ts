import { NextResponse } from "next/server";
import { z } from "zod";
import { getSiteSettings } from "@/actions/siteSettingsActions";
import ContactAdminNotification from "@/emails/ContactAdminNotification";
import ContactAutoReply from "@/emails/ContactAutoReply";
import { sendEmail } from "@/lib/sendEmail";

export const runtime = "nodejs";

const contactRequestSchema = z.object({
  name: z.string().trim().min(3, "Please provide your full name."),
  email: z.string().trim().email("Please provide a valid email address."),
  message: z.string().trim().min(10, "The message must be at least 10 characters long."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = contactRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      const validationError = parsedBody.error.issues[0]?.message;

      if (!validationError) {
        throw new Error("Failed to validate the contact form.");
      }

      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { name, email, message } = parsedBody.data;

    const siteSettings = await getSiteSettings();

    await sendEmail({
      to: siteSettings.email || '',
      subject: `Contact form: ${name}`,
      react: ContactAdminNotification({
        senderName: name,
        senderEmail: email,
        message,
        siteSettings,
      }),
      replyTo: email,
    });

    await sendEmail({
      to: email,
      subject: "Message received confirmation - Wolf Lodges",
      react: ContactAutoReply({
        customerName: name,
        message,
        siteSettings,
      }),
    });

    return NextResponse.json(
      { message: "Your message has been sent." },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send the message.";
    console.error("[CONTACT] Contact form send error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
