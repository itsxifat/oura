'use server'

import nodemailer from 'nodemailer';

// --- CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ==============================================================================
// 🎨 TEMPLATE 1: USER CONFIRMATION (CREAM & GOLD LUXURY)
// ==============================================================================
const generateUserEmail = (name, store, subject) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Appointment Confirmation | OURA</title>
  <style>
    table, td, div, h1, p {font-family: 'Times New Roman', Times, serif;}
    @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;600&family=Manrope:wght@300;400;600&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F9F7F2;">
  <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#F9F7F2;">
    
    <table role="presentation" style="width:100%;border:none;border-spacing:0;">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:center;font-family:'Bodoni Moda', serif;color:#1A1A1A;background-color:#ffffff;box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
            
            <tr>
              <td style="padding:60px 0 30px 0;">
                <h1 style="margin:0;font-size:48px;letter-spacing:6px;font-weight:600;color:#000000;text-transform:uppercase;">OURA</h1>
                <p style="margin:12px 0 0;font-family:'Manrope', sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:4px;color:#D4AF37;">Dhaka &bull; Est. 2025</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 0 40px 0;">
                <div style="height:2px;background-color:#D4AF37;width:40px;margin:0 auto;"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 50px;">
                <p style="margin:0 0 20px;font-size:12px;font-family:'Manrope', sans-serif;text-transform:uppercase;letter-spacing:2px;color:#888888;">Private Concierge</p>
                
                <h2 style="margin:0 0 30px;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.3;">
                  Appointment Request<br>Received
                </h2>
                
                <p style="margin:0 0 30px;font-size:16px;line-height:28px;font-family:'Manrope', sans-serif;font-weight:300;color:#444444;">
                  Dear ${name},<br><br>
                  We are delighted to confirm receipt of your request for a private viewing at our 
                  <strong style="color:#D4AF37;font-weight:600;">${store}</strong>.
                </p>

                <p style="margin:0 0 40px;font-size:16px;line-height:28px;font-family:'Manrope', sans-serif;font-weight:300;color:#444444;">
                  A dedicated style specialist is currently reviewing your requirements regarding <em>"${subject}"</em> 
                  and will contact you shortly to confirm the precise timing of your visit.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 40px 50px;">
                <table role="presentation" style="width:100%;border:1px solid #F0ECE6;background-color:#FBF9F6;border-spacing:0;">
                  <tr>
                    <td style="padding:30px;text-align:center;">
                      <p style="margin:0 0 8px;font-family:'Manrope', sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999999;">Reference Context</p>
                      <p style="margin:0;font-size:18px;color:#1A1A1A;font-style:italic;">${subject}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:40px;background-color:#1A1A1A;text-align:center;">
                <p style="margin:0 0 15px;font-family:'Manrope', sans-serif;font-size:11px;color:#D4AF37;text-transform:uppercase;letter-spacing:2px;">Client Services</p>
                <p style="margin:0 0 25px;font-family:'Manrope', sans-serif;font-size:16px;color:#ffffff;letter-spacing:1px;">+880 1234 567 89</p>
                
                <p style="margin:0;font-family:'Manrope', sans-serif;font-size:10px;color:#666666;line-height:20px;">
                  © 2025 OURA. 128 Gulshan Avenue, Dhaka.<br>
                  Heritage craftsmanship for the modern era.
                </p>
              </td>
            </tr>

          </table>
          </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

// ==============================================================================
// 🛠️ TEMPLATE 2: ADMIN NOTIFICATION (CLEAN DASHBOARD STYLE)
// ==============================================================================
const generateAdminEmail = (data) => {
  const { name, company, email, phone, whatsapp, store, subject, details } = data;
  
  const waNumber = (whatsapp || phone).replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${waNumber}?text=Hello ${name}, contacting from OURA regarding your appointment request.`;
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; margin-top: 40px; margin-bottom: 40px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e4e4e7; }
  .header { background: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f4f4f5; }
  .header h1 { margin: 0; font-size: 18px; letter-spacing: 1px; text-transform: uppercase; color: #18181b; }
  .tag { background: #D4AF37; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-top: 10px; }
  
  .content { padding: 40px; }
  .section-title { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid #f4f4f5; padding-bottom: 10px; }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
  .field { margin-bottom: 0; }
  .label { font-size: 11px; color: #71717a; display: block; margin-bottom: 4px; font-weight: 500; }
  .value { font-size: 15px; color: #09090b; font-weight: 600; }
  .value-link { color: #D4AF37; text-decoration: none; }

  .message-box { background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #f4f4f5; color: #3f3f46; font-size: 14px; line-height: 1.6; margin-top: 5px; }

  .actions { display: flex; gap: 12px; margin-top: 40px; }
  .btn { flex: 1; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; transition: all 0.2s; }
  .btn-wa { background-color: #25D366; color: #fff; }
  .btn-mail { background-color: #18181b; color: #fff; }
  
  .footer { background: #f4f4f5; padding: 15px; text-align: center; font-size: 11px; color: #a1a1aa; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Request</h1>
      <span class="tag">New Lead</span>
    </div>
    
    <div class="content">
      
      <div class="section-title">Client Information</div>
      <div class="grid">
        <div class="field">
          <span class="label">Full Name</span>
          <span class="value">${name}</span>
        </div>
        <div class="field">
          <span class="label">Company</span>
          <span class="value">${company || '-'}</span>
        </div>
        <div class="field">
          <span class="label">Phone</span>
          <span class="value">${phone}</span>
        </div>
        <div class="field">
          <span class="label">WhatsApp</span>
          <span class="value">${whatsapp || '-'}</span>
        </div>
      </div>
      <div class="field" style="margin-bottom: 30px;">
        <span class="label">Email Address</span>
        <span class="value"><a href="mailto:${email}" class="value-link">${email}</a></span>
      </div>

      <div class="section-title">Request Context</div>
      <div class="grid">
        <div class="field">
          <span class="label">Preferred Store</span>
          <span class="value" style="color:#D4AF37;">${store}</span>
        </div>
        <div class="field">
          <span class="label">Subject</span>
          <span class="value">${subject}</span>
        </div>
      </div>
      
      <div class="field">
        <span class="label">Additional Notes</span>
        <div class="message-box">
          ${details ? details.replace(/\n/g, '<br>') : 'No details provided.'}
        </div>
      </div>

      <div class="actions">
        <a href="${waLink}" class="btn btn-wa">Open in WhatsApp</a>
        <a href="mailto:${email}?subject=RE: Appointment Request - ${subject}" class="btn btn-mail">Reply via Email</a>
      </div>

    </div>

    <div class="footer">
      Generated at ${timestamp} • OURA Internal System
    </div>
  </div>
</body>
</html>
  `;
};

// ==============================================================================
// 🚀 MAIN SERVER ACTION
// ==============================================================================
export async function requestAppointment(formData) {
  const { name, email, phone } = formData;

  if (!name || !email || !phone) {
    return { success: false, message: "Please fill in all required fields." };
  }

  try {
    const sendAdmin = transporter.sendMail({
      from: `"OURA System" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `[LEAD] ${name} - ${formData.store}`,
      html: generateAdminEmail(formData),
    });

    const sendUser = transporter.sendMail({
      from: `"OURA Concierge" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Received: Your Appointment Request at ${formData.store}`,
      html: generateUserEmail(name, formData.store, formData.subject),
    });

    await Promise.all([sendAdmin, sendUser]);

    return { success: true, message: "Concierge request sent successfully." };

  } catch (error) {
    console.error("Email Error:", error);
    return { success: false, message: "Server error. Please try again." };
  }
}