import nodemailer from "nodemailer";

const FROM_NAME = "2torConnect";
const DEFAULT_FROM = "support@2torconnect.com";

function getFromAddress(): string {
  const fromEmail = (process.env["EMAIL_FROM"] || process.env["SMTP_USER"] || DEFAULT_FROM).trim();
  return `"${FROM_NAME}" <${fromEmail}>`;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = (process.env["SMTP_USER"] ?? "").trim();
  const pass = (process.env["SMTP_PASS"] ?? "").trim();
  const host = (process.env["SMTP_HOST"] ?? "").trim();
  const port = Number((process.env["SMTP_PORT"] ?? "587").trim());
  const secure = process.env["SMTP_SECURE"]
    ? process.env["SMTP_SECURE"].trim() === "true"
    : port === 465;

  if (!user || !pass) return null;

  if (host) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      tls: {
        rejectUnauthorized: true,
      },
    });
    return cachedTransporter;
  }

  // Fallback: current Gmail setup, unchanged
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function verifyEmailTransporter(): Promise<{ ok: boolean; message: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { ok: false, message: "SMTP credentials not configured (SMTP_USER / SMTP_PASS missing)" };
  }
  try {
    await transporter.verify();
    return { ok: true, message: "SMTP connection verified successfully" };
  } catch (err: any) {
    return { ok: false, message: err?.message || String(err) };
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV] OTP for ${to}: ${otp} (configure SMTP_USER + SMTP_PASS to send real emails)`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
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
  } catch (err: any) {
    console.error("Email send failed:", err?.message || err, err);
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
      from: getFromAddress(),
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
  } catch (err: any) {
    console.error("Admin email send failed:", err?.message || err, err);
  }
}

export interface SendCustomEmailResult {
  ok: boolean;
  error?: string;
  quotaExceeded?: boolean;
}

export async function sendCustomEmail(
  to: string,
  subject: string,
  message: string,
  mediaUrl?: string | null,
  mediaType?: string | null
): Promise<SendCustomEmailResult> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV] Email to ${to} — ${subject}: ${message}${mediaUrl ? ` (media: ${mediaUrl})` : ""}`);
    return { ok: true };
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1b;border-radius:16px;color:#fff">
          <h2 style="color:#a855f7;margin-bottom:8px">2torConnect</h2>
          <div style="color:#ddd;font-size:15px;line-height:1.6;white-space:pre-wrap">${message}</div>
          ${mediaUrl && mediaType?.startsWith("image") ? `<img src="${mediaUrl}" alt="" style="max-width:100%;border-radius:12px;margin-top:16px;display:block" />` : ""}
          ${mediaUrl && mediaType?.startsWith("video") ? `<a href="${mediaUrl}" style="display:block;margin-top:16px;padding:16px;background:#1a1a2e;border-radius:12px;color:#a855f7;text-decoration:none;text-align:center;font-weight:bold">&#9654; Watch attached video</a>` : ""}
          <p style="color:#666;font-size:12px;margin-top:24px">This message was sent to you by the 2torConnect team.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const quotaExceeded = /quota|limit|exceeded|too many|550 5\.4/i.test(errorMsg);
    console.error(`Custom email send failed for ${to}:`, errorMsg);
    return { ok: false, error: errorMsg, quotaExceeded };
  }
}

export interface TutorBookingNotificationParams {
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  studentUniversity?: string | null;
  subject: string;
  scheduledAt: Date | string;
  durationMinutes: number;
  amount?: string | number | null;
  notes?: string | null;
  sessionId?: number;
}

export async function sendSessionBookingNotificationToTutor(params: TutorBookingNotificationParams): Promise<boolean> {
  const transporter = createTransporter();
  const dateObj = new Date(params.scheduledAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : String(params.scheduledAt);

  const studentMessage = (params.notes || "").trim() || "No additional notes provided by student.";
  const formattedFee = params.amount && Number(params.amount) > 0
    ? `₦${Number(params.amount).toLocaleString()}`
    : "Standard session rate";

  const sessionLink = "https://www.2torconnect.com/tutor/sessions";

  if (!transporter) {
    console.log(
      `[DEV] Booking notification to Tutor <${params.tutorEmail}>: ${params.studentName} (${params.studentEmail}) requested ${params.subject} on ${formattedDate}. Message: "${studentMessage}"`
    );
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: params.tutorEmail,
      replyTo: params.studentEmail,
      subject: `New Session Booking Request from ${params.studentName} — ${params.subject}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d0d18;border-radius:20px;color:#ffffff;border:1px solid rgba(255,255,255,0.08);">
          <!-- Header Logo / Brand -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;padding:8px 18px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:999px;margin-bottom:12px;">
              <span style="color:#c084fc;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">⚡ New Session Request</span>
            </div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">2tor<span style="color:#06b6d4;">Connect</span></h1>
            <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">You have received a new 1-on-1 tutoring booking request</p>
          </div>

          <!-- Greeting -->
          <p style="font-size:15px;line-height:1.6;color:#e2e8f0;margin-bottom:20px;">
            Hello <strong>${params.tutorName}</strong>,<br/>
            <strong>${params.studentName}</strong> has requested to book a tutoring session with you on 2torConnect.
          </p>

          <!-- Student Profile & Exact Message Box -->
          <div style="background:#151528;border-radius:14px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Student Information</div>
            <div style="font-size:15px;color:#ffffff;font-weight:700;margin-bottom:4px;">${params.studentName}</div>
            <div style="font-size:13px;color:#06b6d4;margin-bottom:4px;">
              <a href="mailto:${params.studentEmail}" style="color:#06b6d4;text-decoration:none;">${params.studentEmail}</a>
            </div>
            ${params.studentUniversity ? `<div style="font-size:12px;color:#94a3b8;">🎓 ${params.studentUniversity}</div>` : ""}

            <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:11px;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                💬 Message from ${params.studentName}:
              </div>
              <div style="background:rgba(0,0,0,0.3);border-left:3px solid #c084fc;padding:12px 14px;border-radius:8px;font-size:14px;line-height:1.6;color:#f1f5f9;font-style:italic;">
                "${studentMessage}"
              </div>
            </div>
          </div>

          <!-- Booking Details Card -->
          <div style="background:#151528;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Session Details</div>
            
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Course / Subject:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.subject}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Scheduled Date:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Duration:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.durationMinutes} minutes</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Session Fee:</td>
                <td style="padding:6px 0;color:#4ade80;font-weight:700;text-align:right;">${formattedFee}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${sessionLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg, #9333ea, #06b6d4);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 8px 20px rgba(147,51,234,0.3);letter-spacing:0.3px;">
              Review & Confirm in Dashboard →
            </a>
          </div>

          <!-- Reply tip -->
          <p style="font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;margin:0 0 20px;">
            💡 <em>Tip: You can also reply directly to this email to send a message back to ${params.studentName}.</em>
          </p>

          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;text-align:center;font-size:11px;color:#64748b;">
            2torConnect Peer Tutoring Platform · <a href="https://www.2torconnect.com" style="color:#94a3b8;text-decoration:none;">www.2torconnect.com</a>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    console.error(`Booking notification to tutor ${params.tutorEmail} failed:`, err?.message || err);
    return false;
  }
}

export interface StudentBookingConfirmationParams {
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  subject: string;
  scheduledAt: Date | string;
  durationMinutes: number;
  notes?: string | null;
  sessionId?: number;
}

export async function sendSessionBookingConfirmationToStudent(params: StudentBookingConfirmationParams): Promise<boolean> {
  const transporter = createTransporter();
  const dateObj = new Date(params.scheduledAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : String(params.scheduledAt);

  const sessionLink = "https://www.2torconnect.com/student/sessions";

  if (!transporter) {
    console.log(
      `[DEV] Booking confirmation to Student <${params.studentEmail}>: You requested ${params.subject} with ${params.tutorName} on ${formattedDate}.`
    );
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: params.studentEmail,
      replyTo: params.tutorEmail,
      subject: `Booking Request Sent to ${params.tutorName} — ${params.subject} | 2torConnect`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d0d18;border-radius:20px;color:#ffffff;border:1px solid rgba(255,255,255,0.08);">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;padding:8px 18px;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.3);border-radius:999px;margin-bottom:12px;">
              <span style="color:#22d3ee;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✓ Booking Requested</span>
            </div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">2tor<span style="color:#06b6d4;">Connect</span></h1>
            <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Your tutor booking request has been delivered</p>
          </div>

          <p style="font-size:15px;line-height:1.6;color:#e2e8f0;margin-bottom:20px;">
            Hello <strong>${params.studentName}</strong>,<br/>
            Your request for a tutoring session on <strong>${params.subject}</strong> has been sent to <strong>${params.tutorName}</strong>.
          </p>

          <div style="background:#151528;border-radius:14px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Summary of Your Request</div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Tutor:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.tutorName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Subject:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.subject}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Scheduled Date:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Duration:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.durationMinutes} minutes</td>
              </tr>
            </table>

            ${params.notes ? `
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your Notes to Tutor:</div>
              <div style="font-size:13px;color:#cbd5e1;font-style:italic;">"${params.notes}"</div>
            </div>` : ""}
          </div>

          <p style="font-size:14px;line-height:1.6;color:#cbd5e1;margin-bottom:24px;">
            We have emailed ${params.tutorName} with your message. You'll receive another notification as soon as ${params.tutorName} confirms the session.
          </p>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${sessionLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg, #9333ea, #06b6d4);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 8px 20px rgba(147,51,234,0.3);letter-spacing:0.3px;">
              View My Sessions →
            </a>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;text-align:center;font-size:11px;color:#64748b;">
            2torConnect Peer Tutoring Platform · <a href="https://www.2torconnect.com" style="color:#94a3b8;text-decoration:none;">www.2torconnect.com</a>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    console.error(`Booking confirmation to student ${params.studentEmail} failed:`, err?.message || err);
    return false;
  }
}

export interface SessionConfirmedEmailParams {
  studentName: string;
  studentEmail: string;
  tutorName: string;
  subject: string;
  scheduledAt: Date | string;
  sessionId: number;
}

export async function sendSessionConfirmedEmailToStudent(params: SessionConfirmedEmailParams): Promise<boolean> {
  const transporter = createTransporter();
  const dateObj = new Date(params.scheduledAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : String(params.scheduledAt);

  const classroomLink = `https://www.2torconnect.com/session/${params.sessionId}`;

  if (!transporter) {
    console.log(
      `[DEV] Session confirmation to Student <${params.studentEmail}>: ${params.tutorName} confirmed ${params.subject} on ${formattedDate}. Classroom: ${classroomLink}`
    );
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: params.studentEmail,
      subject: `Session Confirmed! ${params.tutorName} accepted your session (${params.subject}) | 2torConnect`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d0d18;border-radius:20px;color:#ffffff;border:1px solid rgba(255,255,255,0.08);">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;padding:8px 18px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:999px;margin-bottom:12px;">
              <span style="color:#4ade80;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🎉 Session Confirmed</span>
            </div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">2tor<span style="color:#06b6d4;">Connect</span></h1>
            <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Your 1-on-1 tutoring session is ready</p>
          </div>

          <p style="font-size:15px;line-height:1.6;color:#e2e8f0;margin-bottom:20px;">
            Great news, <strong>${params.studentName}</strong>!<br/>
            <strong>${params.tutorName}</strong> has accepted your booking request for <strong>${params.subject}</strong>.
          </p>

          <div style="background:#151528;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Tutor:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.tutorName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Course / Subject:</td>
                <td style="padding:6px 0;color:#ffffff;font-weight:700;text-align:right;">${params.subject}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;">Date & Time:</td>
                <td style="padding:6px 0;color:#4ade80;font-weight:700;text-align:right;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${classroomLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg, #10b981, #06b6d4);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 8px 20px rgba(16,185,129,0.3);letter-spacing:0.3px;">
              Open Live Classroom →
            </a>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;text-align:center;font-size:11px;color:#64748b;">
            2torConnect Peer Tutoring Platform · <a href="https://www.2torconnect.com" style="color:#94a3b8;text-decoration:none;">www.2torconnect.com</a>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    console.error(`Session confirmation email to student ${params.studentEmail} failed:`, err?.message || err);
    return false;
  }
}
