import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const order = await req.json();

    // --- 1. DATA PREPARATION ---
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = order.shippingAddress?.method === 'outside' ? 150 : 80;
    const total = subtotal + shipping;
    const discount = total - order.totalAmount;
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const orderRef = order.orderId || order._id.slice(-6).toUpperCase();

    // --- 2. LOAD LOGO (Convert to Base64) ---
    // This is crucial for Puppeteer to render local images in production
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

    // --- 3. HTML TEMPLATE (PREMIUM MAROON DESIGN) ---
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;1,6..96,400&family=Inter:wght@400;500;600&family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
        <style>
          /* --- GLOBAL RESET & A4 CONFIGURATION --- */
          @page { margin: 0; size: A4; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif; 
            background-color: #ffffff; 
            color: #1a1a1a; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          
          /* A4 Container */
          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 15mm 10mm 15mm;
            position: relative;
            box-sizing: border-box;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23800000' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
          }

          /* --- TYPOGRAPHY & COLORS (Maroon) --- */
          .font-serif { font-family: 'Bodoni Moda', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'Inter', monospace; letter-spacing: -0.5px; }
          
          .text-maroon { color: #800000; }
          .bg-maroon { background-color: #800000; }
          .border-maroon { border-color: #800000; }
          
          .text-muted { color: #6B7280; }
          .text-black { color: #1a1a1a; }
          
          .text-sm { font-size: 11px; }
          .text-xs { font-size: 9px; }
          .bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .tracking-wide { letter-spacing: 0.1em; }
          .tracking-widest { letter-spacing: 0.25em; }

          /* --- HEADER SECTION --- */
          .header { text-align: center; margin-bottom: 40px; position: relative; }
          
          .logo-container { margin-bottom: 15px; }
          .logo-img { height: 40px; width: auto; display: block; margin: 0 auto; }
          
          .brand-subtitle { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 15px; 
            margin-bottom: 30px;
          }
          .line { height: 1px; width: 40px; background-color: #800000; display: inline-block; vertical-align: middle; }

          /* --- INFO BOX --- */
          .info-box {
            border: 1.5px solid #1a1a1a;
            padding: 15px 30px;
            margin: 0 auto;
            width: 80%;
            position: relative;
            display: flex;
            justify-content: space-between;
          }
          .corner { position: absolute; width: 8px; height: 8px; border: 1.5px solid #800000; }
          .c-tl { top: -4px; left: -4px; border-bottom: none; border-right: none; }
          .c-tr { top: -4px; right: -4px; border-bottom: none; border-left: none; }
          .c-bl { bottom: -4px; left: -4px; border-top: none; border-right: none; }
          .c-br { bottom: -4px; right: -4px; border-top: none; border-left: none; }

          /* --- ADDRESS GRID --- */
          .address-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding: 20px 0;
            border-top: 1px dashed #e5e5e5;
            border-bottom: 1px dashed #e5e5e5;
          }
          .address-col { width: 48%; }
          
          .section-label { 
            font-size: 9px; 
            font-weight: 700; 
            color: #9CA3AF; 
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .diamond { width: 6px; height: 6px; transform: rotate(45deg); background: #1a1a1a; display: inline-block; }
          .diamond.maroon { background: #800000; }
          
          .client-name { font-size: 20px; margin-bottom: 8px; color: #1a1a1a; }
          .address-text { 
            font-size: 10px; 
            line-height: 1.6; 
            color: #4B5563; 
            padding-left: 12px;
            border-left: 2px solid #E5E7EB;
          }
          .address-text.right {
            text-align: right;
            padding-left: 0;
            padding-right: 12px;
            border-left: none;
            border-right: 2px solid #800000;
          }

          /* --- TABLE --- */
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { 
            text-align: left; 
            font-size: 9px; 
            text-transform: uppercase; 
            letter-spacing: 0.15em; 
            padding-bottom: 15px; 
            border-bottom: 2px solid #1a1a1a; 
            color: #1a1a1a;
          }
          td { padding: 15px 0; border-bottom: 1px dashed #e5e5e5; vertical-align: top; font-size: 11px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .item-name { font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; text-transform: uppercase; }
          .sku-pill { 
            display: inline-block; 
            background: #f3f4f6; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 8px; 
            color: #666;
            margin-right: 8px;
          }
          .barcode-font { font-family: 'Libre Barcode 39 Text'; font-size: 24px; line-height: 1; margin-left: 5px; vertical-align: middle; }

          /* --- SUMMARY --- */
          .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 60px; }
          .summary-card { 
            width: 300px; 
            background: #FAFAFA; 
            border: 1px solid #E5E7EB; 
            padding: 20px; 
            position: relative;
          }
          .maroon-accent { position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: #800000; }
          
          .sum-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10px; color: #4B5563; }
          .sum-row.total { 
            margin-top: 15px; 
            padding-top: 15px; 
            border-top: 2px solid #1a1a1a; 
            color: #1a1a1a;
            align-items: flex-end;
          }
          .total-label { font-weight: 700; letter-spacing: 0.1em; font-size: 11px; }
          .total-amount { font-family: 'Bodoni Moda', serif; font-size: 24px; font-weight: 700; line-height: 1; }

          /* --- FOOTER --- */
          .footer-main { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            padding-bottom: 20px; 
            border-bottom: 1px solid #1a1a1a;
            margin-bottom: 15px;
          }
          .stamp {
            border: 2px solid #1a1a1a;
            padding: 8px 20px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transform: rotate(-2deg);
            display: inline-block;
          }
          .stamp.paid { color: #047857; border-color: #047857; }
          
          .auth-block { text-align: right; }
          .auth-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
          .auth-sub { font-size: 8px; color: #9CA3AF; letter-spacing: 0.05em; text-transform: uppercase; }

          .copyright { 
            display: flex; 
            justify-content: space-between; 
            font-size: 8px; 
            color: #9CA3AF; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          
          <div class="header">
            <div class="logo-container">
               <img src="${logoBase64}" class="logo-img" alt="OURA" />
            </div>
            
            <div class="brand-subtitle">
              <div class="line"></div>
              <span class="text-maroon bold tracking-widest uppercase text-xs" style="margin: 0 10px;">Official Receipt</span>
              <div class="line"></div>
            </div>

            <div class="info-box">
              <div class="corner c-tl"></div><div class="corner c-tr"></div>
              <div class="corner c-bl"></div><div class="corner c-br"></div>
              
              <div style="text-align: left;">
                <span class="text-xs text-muted tracking-widest bold uppercase mb-2" style="display:block;">Order Reference</span>
                <span class="font-mono text-black bold" style="font-size: 18px;">#${orderRef}</span>
              </div>
              <div style="text-align: right;">
                <span class="text-xs text-muted tracking-widest bold uppercase mb-2" style="display:block;">Issued Date</span>
                <span class="font-mono text-black bold" style="font-size: 18px;">${dateStr}</span>
              </div>
            </div>
          </div>

          <div class="address-grid">
            <div class="address-col">
              <div class="section-label tracking-widest">
                <div class="diamond"></div> &nbsp; BILLED TO
              </div>
              <div class="client-name font-serif">${order.guestInfo?.firstName} ${order.guestInfo?.lastName}</div>
              <div class="address-text font-sans">
                ${order.shippingAddress?.address}<br>
                ${order.shippingAddress?.city} - ${order.shippingAddress?.postalCode}<br>
                <span class="font-mono bold" style="color: #1a1a1a; display: block; margin-top: 4px;">${order.guestInfo?.phone}</span>
              </div>
            </div>
            
            <div class="address-col" style="text-align: right;">
              <div class="section-label tracking-widest" style="justify-content: flex-end;">
                FROM &nbsp; <div class="diamond maroon"></div>
              </div>
              <div class="client-name font-serif">OURA Sanctuary</div>
              <div class="address-text right font-sans">
                128, Gulshan Avenue<br>
                Dhaka, Bangladesh<br>
                concierge@oura.com
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="50%">Item Details</th>
                <th width="15%" class="text-center">Size</th>
                <th width="15%" class="text-center">Qty</th>
                <th width="20%" class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <span class="item-name">${item.name}</span>
                    <div style="display: flex; align-items: center;">
                      ${item.sku ? `<span class="sku-pill font-mono">SKU: ${item.sku}</span>` : ''}
                      ${item.barcode ? `<span class="barcode-font">*${item.barcode}*</span>` : ''}
                    </div>
                  </td>
                  <td class="text-center bold">${item.size || '-'}</td>
                  <td class="text-center bold">${item.quantity}</td>
                  <td class="text-right bold">৳ ${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-wrapper">
            <div class="summary-card">
              <div class="maroon-accent"></div>
              
              <div class="sum-row">
                <span class="uppercase tracking-wide">Subtotal</span>
                <span class="bold">৳ ${subtotal.toLocaleString()}</span>
              </div>
              
              <div class="sum-row">
                <span class="uppercase tracking-wide">Shipping</span>
                <span class="bold">৳ ${shipping.toLocaleString()}</span>
              </div>
              
              ${discount > 0 ? `
              <div class="sum-row" style="color: #000;">
                <span class="uppercase tracking-wide bold">Discount</span>
                <span class="bold">- ৳ ${Math.abs(discount).toLocaleString()}</span>
              </div>
              ` : ''}

              <div class="sum-row total">
                <span class="total-label">TOTAL</span>
                <span class="total-amount">৳ ${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: auto;">
            <div class="footer-main">
              <div>
                <div class="stamp ${order.status === 'Delivered' ? 'paid' : ''}">
                  ${order.status === 'Delivered' ? 'PAID / DELIVERED' : 'PAYMENT DUE (COD)'}
                </div>
              </div>
              <div class="auth-block">
                <span class="auth-label">System Generated</span>
                <span class="auth-sub">Electronic Authentication</span>
              </div>
            </div>
            
            <div class="copyright">
              <span>© ${new Date().getFullYear()} OURA. All Rights Reserved.</span>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    // --- 4. PUPPETEER GENERATION ---
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 } 
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OURA_Invoice_${orderRef}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Puppeteer Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}