import nodemailer from "nodemailer";

const user = process.env.GMAIL_SMTP_USER as string;
const pass = process.env.GMAIL_SMTP_APP_PASSWORD as string;

if (!user || !pass) {
  console.warn("[mailer] Missing GMAIL_SMTP_USER or GMAIL_SMTP_APP_PASSWORD");
}

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
});

export const FROM_EMAIL = process.env.FROM_EMAIL || user || "info@iconicvirtual.ai";
