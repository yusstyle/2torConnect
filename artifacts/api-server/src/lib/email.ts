import nodemailer from "nodemailer";

const SMTP_USER = process.env["SMTP_USER"] ?? "";
const SMTP_PASS = process.env["SMTP_PASS"] ?? "";
const FROM_NAME = "2torConnect";

function createTransporter() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV] OTP for ${to}: ${otp} (configure SMTP_USER + SMTP_PASS to send real emails)`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject: "Your 2torConnect Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1b;border-radius:16px;color:#fff">
          <h2 style="color:#a855f7;margin-bottom:8px">2torConnect</h2>
          <p style="color:#aaa;margin-bottom:24px">Your one-time verification code is:</p>
          <div style="background:#1a1a2e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#a855f7">${otp}</span>
          </div>
          <p style="color:#aaa;font-size:13px">This code expires in <strong style="color:#fff">10 minutes</strong>. Never share it with anyone.</p>
          <p style="color:#666;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

export async function sendNewAdminEmail(to: string, name: string, password: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[DEV] New admin credentials for ${to} — password: ${password}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject: "Your 2torConnect Admin Account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1b;border-radius:16px;color:#fff">
          <h2 style="color:#a855f7;margin-bottom:8px">2torConnect Admin</h2>
          <p style="color:#aaa;margin-bottom:24px">Hello <strong style="color:#fff">${name}</strong>, an admin account has been created for you.</p>
          <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;color:#aaa;font-size:13px">Email: <strong style="color:#fff">${to}</strong></p>
            <p style="margin:0;color:#aaa;font-size:13px">Password: <strong style="color:#a855f7">${password}</strong></p>
          </div>
          <p style="color:#aaa;font-size:13px">Please log in and change your password as soon as possible.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin email send failed:", err);
  }
}
