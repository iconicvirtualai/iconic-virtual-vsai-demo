import nodemailer from "nodemailer";

export function getMailerOrNull() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // Gmail not configured yet? Return null so the rest of the flow still works.
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}
