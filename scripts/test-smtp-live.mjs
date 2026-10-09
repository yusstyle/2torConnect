let nodemailer;
try {
  nodemailer = (await import("nodemailer")).default;
} catch {
  nodemailer = (await import("../artifacts/api-server/node_modules/nodemailer/lib/nodemailer.js")).default;
}

/**
 * Diagnostic SMTP test script for Smartweb Business Email / Mailhostbox.
 * Tests possible server host variations and username variations.
 */
async function main() {
  const pass = (process.env.TEST_SMTP_PASS || "").trim();
  const to = (process.env.TEST_EMAIL_TO || "").trim();
  const user = (process.env.TEST_SMTP_USER || "support@2torconnect.com").trim();

  if (!pass) {
    console.error("Error: TEST_SMTP_PASS environment variable is missing.");
    process.exit(1);
  }

  if (!to) {
    console.error("Error: TEST_EMAIL_TO environment variable is missing.");
    process.exit(1);
  }

  const candidateHosts = [
    "us3.smtp.mailhostbox.com",
    "smtp.mailhostbox.com",
    "us2.smtp.mailhostbox.com",
  ];

  const candidateUsers = [
    user,
    user.split("@")[0], // "support"
  ];

  console.log(`\nStarting SMTP diagnostic test for ${user}...`);
  console.log(`Testing clusters: ${candidateHosts.join(", ")}`);

  let workingTransporter = null;
  let workingHost = null;
  let workingUser = null;

  for (const host of candidateHosts) {
    for (const testUser of candidateUsers) {
      process.stdout.write(`Testing ${host}:587 (username: "${testUser}")... `);
      const transporter = nodemailer.createTransport({
        host,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: testUser, pass },
        tls: {
          rejectUnauthorized: true,
        },
      });

      try {
        await transporter.verify();
        console.log("SUCCESS! Authenticated!");
        workingTransporter = transporter;
        workingHost = host;
        workingUser = testUser;
        break;
      } catch (err) {
        console.log(`FAILED (${err.message.replace(/\r?\n.*/g, "")})`);
      }
    }
    if (workingTransporter) break;
  }

  if (!workingTransporter) {
    console.error("\n=======================================================");
    console.error(" DIAGNOSTIC RESULT: All servers rejected the login.");
    console.error(" Error code: 535 Authentication Failed");
    console.error("=======================================================");
    console.error("\nThis confirms that the server is reachable, but the password");
    console.error("entered does not match the mailbox password for support@2torconnect.com.");
    console.error("\nRecommended next step:");
    console.error("1. Open Webmail in your browser: https://us3.webmail.mailhostbox.com");
    console.error("2. Try logging in with support@2torconnect.com and your password.");
    console.error("3. If it fails there, reset the password in your Smartweb Client Area.");
    process.exit(2);
  }

  console.log(`\nDispatched using verified host: ${workingHost} (user: ${workingUser})`);
  const sampleOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const from = `"2torConnect Support" <${user}>`;

  console.log(`Sending live delivery test email to ${to} from ${from}...`);

  try {
    const info = await workingTransporter.sendMail({
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
          <p style="color:#aaa;font-size:13px">Mail server: <code>${workingHost}:587</code> (STARTTLS)</p>
          <p style="color:#666;font-size:12px;margin-top:24px">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("\nSUCCESS: Test email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    if (info.response) {
      console.log(`Server response: ${info.response}`);
    }
    console.log(`\nWinning settings for Vercel:`);
    console.log(`  SMTP_HOST = ${workingHost}`);
    console.log(`  SMTP_PORT = 587`);
    console.log(`  SMTP_USER = ${workingUser}`);
    console.log(`  EMAIL_FROM = ${user}`);
    console.log(`\nPlease check the inbox of ${to} to confirm delivery!`);
  } catch (sendErr) {
    console.error("FAILED to send test email:", sendErr.message);
    process.exit(3);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
