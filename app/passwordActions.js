'use server';

import connectDB from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; 
import path from "path";

// --- REQUEST RESET LINK ---
export async function requestPasswordReset(formData) {
  await connectDB();
  const email = formData.get("email");

  const user = await User.findOne({ email });
  
  // Security: Return success even if user not found to prevent enumeration
  if (!user) {
    return { success: true, message: "If an account exists, a link has been sent." };
  }

  // 1. Generate Token & Expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // 1 Hour Validity

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expiryDate;
  await user.save();

  // 2. Create Reset Link
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // 3. SEND PREMIUM EMAIL
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,       
        pass: process.env.GMAIL_APP_PASSWORD, 
      },
    });

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');

    const mailOptions = {
      from: `"OURA Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password | OURA",
      // Attach Logo for embedded display
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'oura-logo' 
      }],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;700&family=Manrope:wght@300;400;600&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 60px 0;">
            <tr>
              <td align="center">
                
                <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                  
                  <tr>
                    <td align="center" style="padding: 50px 0 20px 0; background-color: #000000;">
                      <img src="cid:oura-logo" alt="OURA" style="width: 200px; display: block;" />
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="center">
                       <div style="width: 100%; height: 4px; background-color: #B91C1C;"></div>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 50px 50px;">
                      <h3 style="margin: 0 0 20px 0; font-family: 'Times New Roman', serif; font-size: 24px; color: #000000; font-weight: bold;">
                        Reset Password
                      </h3>
                      
                      <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 24px; color: #666666;">
                        We received a request to regain access to your OURA account. 
                        Please click the button below to create a new secure password.
                      </p>

                      <a href="${resetLink}" style="display: inline-block; background-color: #B91C1C; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border-radius: 4px;">
                        Reset Access
                      </a>
                      
                      <p style="margin: 30px 0 0 0; font-size: 11px; color: #999999; line-height: 1.6;">
                        If you did not request this change, please ignore this email.<br/>
                        This link will expire in 60 minutes.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 20px 50px 40px 50px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                       <p style="margin: 0; font-size: 10px; color: #bbbbbb; text-transform: uppercase; letter-spacing: 1px;">
                         &copy; ${new Date().getFullYear()} OURA Collection
                       </p>
                    </td>
                  </tr>
                  
                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Secure link sent to your inbox." };

  } catch (error) {
    console.error("Email Error:", error);
    return { error: "Failed to send email. Please try again." };
  }
}

// --- PERFORM RESET ---
export async function resetPassword(token, newPassword) {
  await connectDB();
  
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() } 
  });

  if (!user) {
    return { error: "This link is invalid or has expired." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
}