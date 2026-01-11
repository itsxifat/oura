'use server';

import connectDB from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; 

// --- REQUEST RESET LINK ---
export async function requestPasswordReset(formData) {
  await connectDB();
  const email = formData.get("email");

  const user = await User.findOne({ email });
  
  // Security: Return success even if user not found
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

    const mailOptions = {
      from: `"ANAQA Concierge" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Secure Access Request | ANAQA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;700&family=Manrope:wght@300;400;600&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 60px 0;">
            <tr>
              <td align="center">
                
                <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e0e0e0; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
                  
                  <tr>
                    <td align="center" style="padding: 50px 0 30px 0;">
                      <h1 style="margin: 0; font-family: 'Times New Roman', serif; font-size: 28px; letter-spacing: 4px; color: #000000; text-transform: uppercase;">
                        ANAQA
                      </h1>
                      <p style="margin: 5px 0 0 0; font-size: 9px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: bold;">
                        The Sanctuary
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center">
                       <div style="width: 40px; height: 1px; background-color: #D4AF37;"></div>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 40px 50px;">
                      <h3 style="margin: 0 0 20px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #000000;">
                        Password Recovery
                      </h3>
                      <p style="margin: 0 0 40px 0; font-size: 13px; line-height: 26px; color: #666666; font-weight: 300;">
                        We received a request to restore access to your account. 
                        To maintain the security of your profile, please use the secure link below to set a new passcode.
                      </p>

                      <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 18px 40px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #000000;">
                        Reset Password
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 0 50px 50px 50px;">
                       <p style="margin: 0; font-size: 11px; color: #999999; font-style: italic;">
                         This link is valid for 60 minutes.
                       </p>
                       <p style="margin: 10px 0 0 0; font-size: 10px; color: #cccccc; text-transform: uppercase; letter-spacing: 1px;">
                         &copy; ${new Date().getFullYear()} ANAQA Luxury
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