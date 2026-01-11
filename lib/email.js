import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"ANAQA Support" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to ANAQA!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #D4AF37; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}