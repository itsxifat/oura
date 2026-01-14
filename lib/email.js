import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// --- EMAIL CONFIGURATION MAP ---
const emailTypes = {
  verification: {
    subject: "Verify Your Account",
    headline: "Welcome to OURA",
    body: "Please use the code below to complete your verification.",
  },
  email_change: {
    subject: "Verify New Email Address",
    headline: "Security Update",
    body: "You requested to change your account email. Use the code below to confirm this change.",
  },
  password_reset: {
    subject: "Reset Your Password",
    headline: "Password Reset",
    body: "We received a request to reset your password. Use the code below to proceed.",
  },
  login: {
    subject: "Login Verification",
    headline: "Secure Login",
    body: "Use the following code to complete your login securely.",
  }
};

// --- HTML TEMPLATE GENERATOR ---
const generateEmailTemplate = (otp, type) => {
  const config = emailTypes[type] || emailTypes.verification;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #000000; padding: 40px 0; text-align: center; }
        /* Logo Style: Centered, constrained width */
        .logo { width: 120px; height: auto; display: block; margin: 0 auto; }
        .content { padding: 40px 30px; text-align: center; }
        .headline { font-size: 24px; color: #111111; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .text { color: #666666; font-size: 14px; line-height: 1.6; margin-bottom: 30px; }
        .otp-box { background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 4px; padding: 20px; display: inline-block; margin-bottom: 30px; }
        .otp-code { color: #B91C1C; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: monospace; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 11px; color: #999999; }
        .divider { height: 2px; width: 40px; background-color: #B91C1C; margin: 0 auto 20px auto; }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="header">
          <img src="cid:oura-logo" alt="OURA" class="logo" />
        </div>

        <div class="content">
          <div class="headline">${config.headline}</div>
          <div class="divider"></div>
          <p class="text">${config.body}</p>
          
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>

          <p class="text" style="font-size: 12px; margin-bottom: 0;">
            This code will expire in 10 minutes.<br/>
            If you did not request this, please ignore this email.
          </p>
        </div>

        <div class="footer">
          &copy; ${new Date().getFullYear()} OURA Collection. All rights reserved.<br/>
          Secure Automated System
        </div>
      </div>
    </body>
    </html>
  `;
};

// --- SEND FUNCTION ---
export async function sendOtpEmail(to, otp, type = 'verification') {
  const config = emailTypes[type] || emailTypes.verification;
  
  // Resolve the path to the logo file in the public folder
  // Note: In Next.js, process.cwd() is the root of the project
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  const mailOptions = {
    from: `"OURA Security" <${process.env.GMAIL_USER}>`,
    to,
    subject: config.subject,
    html: generateEmailTemplate(otp, type),
    // Attach the image so it can be referenced via cid
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'oura-logo' // This ID matches the src="cid:oura-logo" in the HTML
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false, error: "Failed to send email" };
  }
}