import nodemailer from "nodemailer";
import "./config";

const smtpEnabled = process.env.SMTP_ENABLED === "true";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE !== "false";
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

function isPlaceholderConfiguration(): boolean {
  return [smtpUser, smtpPassword, smtpFrom].some((value) =>
    !value ||
    value.includes("your-email@gmail.com") ||
    value.includes("your-gmail-app-password"),
  );
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!smtpEnabled || !smtpHost || isPlaceholderConfiguration()) {
    console.warn(`[email] SMTP is disabled; verification code for ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "SOG TradePro email verification code",
    text: `Your SOG TradePro verification code is ${code}. It expires in 3 minutes.`,
    html: `<p>Your SOG TradePro verification code is <strong>${code}</strong>.</p><p>This code expires in 3 minutes.</p>`,
  });
}

export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  if (!smtpEnabled || !smtpHost || isPlaceholderConfiguration()) {
    console.warn(`[email] SMTP is disabled; password reset code for ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "SOG TradePro password reset code",
    text: `Your SOG TradePro password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your SOG TradePro password reset code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });
}
