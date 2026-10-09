let nodemailer;
try {
  nodemailer = (await import("nodemailer")).default;
} catch {
  nodemailer = (await import("../artifacts/api-server/node_modules/nodemailer/lib/nodemailer.js")).default;
}

/**
 * Standalone SMTP test script for Smartweb Business Email / Mailhostbox.
 * Reads configuration from environment variables (or process arguments).
 * Does NOT persist or commit secrets.
 */
async function main() {
  const host = process.env.TEST_SMTP_HOST || "us3.smtp.mailhostbox.com";
  const port = Number(process.env.TEST_SMTP_PORT || "587");
  const user = process.env.TEST_SMTP_USER || "support@2torconnect.com";
  const pass = process.env.TEST_SMTP_PASS;
  const to = process.env.TEST_EMAIL_TO;
  const from = process.env.TEST_EMAIL_FROM || `\"2torConnect\" <${user}>`;

  if (!pass) {
    console.error("Error: TEST_SMTP_PASS environment variable is missing.");
    process.exit(1);
  }

  if (!to) {
    console.error("Error: TEST_EMAIL_TO environment variable is missing.");
    process.exit(1);
  }

  console.log(`\nConnecting to SMTP server ${host}:${port} as ${user}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    console.log("Verifying SMTP credentials and TLS handshake...");
    await transporter.verify();
    console.log("SUCCESS: SMTP connection verified and authenticated successfully.\n");
  } catch (verifyErr) {
    console.error("FAILED: SMTP authentication/connection error:", verifyErr.message);
    if (verifyErr.response) {
      console.error("Server response:", verifyErr.response);
    }
    process.exit(2);
  }

  const sampleOtp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`Sending delivery test email to ${to} from ${from}...`);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "2torConnect - SMTP Delivery Test",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1b;border-radius:16px;color:#fff">
          <h2 style="color:#a855f7;margin-bottom:8px">2torConnect</h2>
          <p style="color:#aaa;margin-bottom:24px">This is a live test email confirming that outgoing emails from <strong>${user}</strong> are delivering properly.</p>
          <div style="background:#1a1a2e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#a855f7">${sampleOtp}</span>
          </div>
          <p style="color:#aaa;font-size:13px">Mail server: <code>${host}:${port}</code> (STARTTLS)</p>
          <p style="color:#666;font-size:12px;margin-top:24px">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("SUCCESS: Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    if (info.response) {
      console.log(`Server response: ${info.response}`);
    }
    console.log(`\nPlease check the inbox (and spam/junk folder) of ${to} to confirm delivery.`);
  } catch (sendErr) {
    console.error("FAILED: Could not send test email:", sendErr.message);
    if (sendErr.response) {
      console.error("Server response:", sendErr.response);
    }
    process.exit(3);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

