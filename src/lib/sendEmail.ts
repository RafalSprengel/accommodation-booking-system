import type { ReactNode } from "react";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing Resend API key in environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailBaseProps {
  to: string;
  subject: string;
  replyTo?: string;
}

type SendEmailProps =
  | (SendEmailBaseProps & {
      html: string;
      react?: never;
    })
  | (SendEmailBaseProps & {
      react: ReactNode;
      html?: never;
    });

export async function sendEmail({
  to,
  subject,
  replyTo,
  ...content
}: SendEmailProps) {
  return resend.emails.send({
    from: "Wolf Lodges <bookings@rafalsprengel.com>",
    to,
    subject,
    replyTo,
    ...content,
  });
}

export async function sendBookingEmail(props: SendEmailProps) {
  return sendEmail(props);
}
