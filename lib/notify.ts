// lib/notify.ts
import nodemailer from "nodemailer";
import twilio from "twilio";

type EmailArgs = {
  to: string;
  downloadPageUrl: string;
  receiptUrl: string | null;
  jobId: string | null;
  selectedIndex: number;
};

type SmsArgs = {
  to: string;
  downloadPageUrl: string;
  jobId: string | null;
  selectedIndex: number;
};

function canSendEmail() {
  return !!(
    process.env.GMAIL_SMTP_USER &&
    process.env.GMAIL_SMTP_APP_PASSWORD &&
    process.env.FROM_EMAIL
  );
}

function canSendSms() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendOrderEmail(args: {
  to: string;
  downloadPageUrl: string;
  receiptUrl: string | null;
  jobId: string | null;
  selectedIndex: number;
}) {
  if (!canSendEmail()) {
    console.warn("[notify] Gmail env not configured; skipping email send");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_SMTP_USER!,
      pass: process.env.GMAIL_SMTP_APP_PASSWORD!,
    },
  });

  const from = process.env.FROM_EMAIL!;
  const subject = "Your IconicVirtual.AI staging is ready ✅";

  const html = `
  <div style="font-family:Arial,sans-serif; line-height:1.45;">
    <h2 style="margin:0 0 8px;">Payment complete ✅</h2>
    <p style="margin:0 0 14px;">Your download is ready.</p>

    <p style="margin:18px 0;">
      <a href="${args.downloadPageUrl}"
         style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;
                padding:12px 16px;border-radius:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">
        Download your image
      </a>
    </p>

    ${args.receiptUrl ? `<p style="margin:0 0 8px;"><a href="${args.receiptUrl}">View Stripe receipt</a></p>` : ""}

    <hr style="margin:18px 0; border:none; border-top:1px solid #e5e7eb;" />

    <p style="margin:0; color:#64748b; font-size:12px;">
      Order: ${args.jobId || "—"} • Selection: #${args.selectedIndex + 1}
    </p>
  </div>`;

  await transporter.sendMail({
    from,
    to: args.to,
    subject,
    html,
  });
}

export async function sendOrderSms(args: SmsArgs) {
  if (!canSendSms()) {
    console.warn("[notify] Twilio not configured; skipping SMS send");
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  const msg = `IconicVirtual.AI ✅ Payment complete. Download your staging here: ${args.downloadPageUrl}`;

  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER!,
    to: args.to,
    body: msg,
  });
}
