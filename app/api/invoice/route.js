import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// ─── HTML BUILDER (single source of truth for preview + PDF) ─────────────────
function buildInvoiceHTML(order, logoBase64) {
  const subtotal    = order.subTotal  ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping    = order.shippingFee ?? (order.shippingAddress?.method === 'outside' ? 150 : 80);
  const discount    = order.discountAmount ?? 0;
  const dateStr     = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const orderRef    = order.orderId || ('#' + (order._id?.slice(-6) ?? 'REF').toUpperCase());
  const isPaid      = order.paymentStatus === 'Paid';
  const isOnline    = order.paymentMethod === 'bKash' || order.paymentMethod === 'SSLCommerz';
  const methodLabel = order.paymentMethod === 'SSLCommerz' ? 'SSL Commerz' : order.paymentMethod === 'bKash' ? 'bKash' : 'Cash on Delivery';
  const dueAmount   = isPaid ? 0 : order.totalAmount;

  const statusBadge = {
    Pending:    'background:#FDF6B2;color:#723B13',
    Processing: 'background:#E1EFFE;color:#1E429F',
    Shipped:    'background:#EDEBFE;color:#5521B5',
    Delivered:  'background:#DEF7EC;color:#03543F',
    Cancelled:  'background:#FDE8E8;color:#9B1C1C',
  }[order.status] ?? 'background:#f3f4f6;color:#374151';

  const itemRows = order.items.map((item, i) => {
    const hasDiscount = item.basePrice && item.basePrice > item.price;
    const lineTotal   = item.price * item.quantity;
    return `
      <tr>
        <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid #f0f0f0;">
          <span style="font-family:'Oswald',sans-serif;font-size:10px;font-weight:400;color:#ccc;">
            ${String(i + 1).padStart(2, '0')}
          </span>
        </td>
        <td style="padding:12px 8px 12px 0;vertical-align:top;border-bottom:1px solid #f0f0f0;">
          <span style="font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;color:#0a0a0a;display:block;margin-bottom:5px;">
            ${item.name}
          </span>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            ${item.sku ? `<span style="background:#f5f5f5;border:1px solid #e8e8e8;padding:1px 6px;font-size:7px;font-family:'Inter',monospace;color:#666;letter-spacing:0.05em;">SKU: ${item.sku}</span>` : ''}
            ${item.barcode ? `<span style="font-family:'Libre Barcode 39 Text',cursive;font-size:22px;line-height:1;color:#0a0a0a;letter-spacing:0;">${item.barcode}</span>` : ''}
          </div>
        </td>
        <td style="padding:12px 6px;text-align:center;vertical-align:top;border-bottom:1px solid #f0f0f0;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;color:#0a0a0a;">
          ${item.size || '—'}
        </td>
        <td style="padding:12px 6px;text-align:center;vertical-align:top;border-bottom:1px solid #f0f0f0;font-size:11px;font-weight:600;color:#0a0a0a;">
          ${item.quantity}
        </td>
        <td style="padding:12px 6px;text-align:right;vertical-align:top;border-bottom:1px solid #f0f0f0;">
          ${hasDiscount ? `<span style="text-decoration:line-through;color:#bbb;font-size:9px;display:block;">৳ ${item.basePrice.toLocaleString()}</span>` : ''}
          <span style="font-size:10px;font-weight:600;color:${hasDiscount ? '#800000' : '#0a0a0a'};">৳ ${item.price.toLocaleString()}</span>
        </td>
        <td style="padding:12px 0 12px 6px;text-align:right;vertical-align:top;border-bottom:1px solid #f0f0f0;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#0a0a0a;">
          ৳ ${lineTotal.toLocaleString()}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: A4 portrait; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, sans-serif;
      background: #ffffff;
      color: #0a0a0a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 11px;
      line-height: 1.5;
    }
  </style>
</head>
<body>

<div style="width:210mm;min-height:297mm;background:#ffffff;position:relative;">

  <!-- TOP BAR -->
  <div style="width:100%;height:5px;background:#800000;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

  <!-- PAGE BODY -->
  <div style="padding:10mm 14mm 12mm 14mm;">

    <!-- ── HEADER ── -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:8mm;border-bottom:1px solid #e8e8e8;margin-bottom:6mm;">

      <!-- Brand Left -->
      <div>
        <img src="${logoBase64}" alt="OURA" style="height:38px;width:auto;display:block;margin-bottom:6px;">
        <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:300;letter-spacing:0.28em;color:#aaa;text-transform:uppercase;display:block;">
          Engineered for the Modern Aesthetic
        </span>
      </div>

      <!-- Invoice Right -->
      <div style="text-align:right;">
        <span style="font-family:'Oswald',sans-serif;font-size:52px;font-weight:700;letter-spacing:0.04em;color:#0a0a0a;line-height:1;display:block;">
          INVOICE
        </span>
        <span style="font-family:'Oswald',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.18em;color:#800000;margin-top:3px;display:block;text-transform:uppercase;">
          ${orderRef}
        </span>
        <span style="font-size:10px;color:#999;letter-spacing:0.06em;margin-top:2px;display:block;font-weight:400;">
          ${dateStr}
        </span>
      </div>
    </div>

    <!-- ── META STRIP ── -->
    <div style="display:flex;border:1px solid #ebebeb;background:#fafafa;margin-bottom:8mm;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="flex:1;padding:9px 14px;border-right:1px solid #ebebeb;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;display:block;margin-bottom:4px;">Status</span>
        <span style="font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;display:inline-block;padding:2px 8px;${statusBadge}">
          ${order.status}
        </span>
      </div>
      <div style="flex:1;padding:9px 14px;border-right:1px solid #ebebeb;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;display:block;margin-bottom:4px;">Payment</span>
        <span style="font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.05em;color:#0a0a0a;text-transform:uppercase;">
          ${methodLabel}${isPaid ? ' &nbsp;✓' : ''}
        </span>
      </div>
      <div style="flex:1;padding:9px 14px;border-right:1px solid #ebebeb;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;display:block;margin-bottom:4px;">Delivery Zone</span>
        <span style="font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.05em;color:#0a0a0a;text-transform:uppercase;">
          ${order.shippingAddress?.method === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka'}
        </span>
      </div>
      <div style="flex:1;padding:9px 14px;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;display:block;margin-bottom:4px;">Items</span>
        <span style="font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.05em;color:#0a0a0a;">
          ${order.items.length} Item${order.items.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>

    <!-- ── ADDRESSES ── -->
    <div style="display:flex;gap:0;margin-bottom:8mm;">

      <!-- Bill To -->
      <div style="flex:1;padding-right:10mm;border-right:1px solid #ebebeb;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.3em;color:#800000;text-transform:uppercase;display:block;margin-bottom:8px;">
          ▸ &nbsp; Bill To
        </span>
        <span style="font-family:'Oswald',sans-serif;font-size:17px;font-weight:600;color:#0a0a0a;letter-spacing:0.02em;display:block;margin-bottom:7px;">
          ${order.guestInfo?.firstName || ''} ${order.guestInfo?.lastName || ''}
        </span>
        <div style="font-size:9.5px;line-height:1.75;color:#555;border-left:2px solid #ebebeb;padding-left:10px;">
          <span style="display:block;">${order.shippingAddress?.address || order.guestInfo?.address || '—'}</span>
          <span style="display:block;">${order.shippingAddress?.city || order.guestInfo?.city || ''}${order.shippingAddress?.postalCode ? ' — ' + order.shippingAddress.postalCode : ''}</span>
          <span style="display:block;font-family:'Inter',monospace;font-size:10px;font-weight:700;color:#0a0a0a;margin-top:5px;letter-spacing:0.05em;">
            ${order.guestInfo?.phone || ''}
          </span>
          ${order.guestInfo?.email ? `<span style="display:block;color:#888;font-size:9px;margin-top:2px;">${order.guestInfo.email}</span>` : ''}
        </div>
      </div>

      <!-- From -->
      <div style="flex:1;padding-left:10mm;text-align:right;">
        <span style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.3em;color:#800000;text-transform:uppercase;display:block;margin-bottom:8px;">
          From &nbsp; ◂
        </span>
        <span style="font-family:'Oswald',sans-serif;font-size:17px;font-weight:600;color:#0a0a0a;letter-spacing:0.02em;display:block;margin-bottom:7px;">
          OURA Lifestyle
        </span>
        <div style="font-size:9.5px;line-height:1.75;color:#555;border-right:2px solid #800000;padding-right:10px;">
          <span style="display:block;">Dhaka, Bangladesh</span>
          <span style="display:block;font-family:'Inter',monospace;font-size:9px;margin-top:2px;color:#888;">info@oura-lifestyle.com</span>
          <span style="display:block;font-size:9px;color:#888;">oura-lifestyle.com</span>
        </div>
      </div>
    </div>

    <!-- ── ITEMS TABLE ── -->
    <div style="margin-bottom:8mm;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #0a0a0a;">
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 8px 9px 0;text-align:left;width:22px;">#</th>
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 0 9px 0;text-align:left;">Item Description</th>
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 6px 9px;text-align:center;width:52px;">Size</th>
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 6px 9px;text-align:center;width:42px;">Qty</th>
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 6px 9px;text-align:right;width:80px;">Unit Price</th>
            <th style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:400;letter-spacing:0.25em;color:#aaa;text-transform:uppercase;padding:0 0 9px 6px;text-align:right;width:90px;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- ── SUMMARY ── -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:9mm;">
      <div style="width:46%;">

        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:400;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Subtotal</span>
          <span style="font-size:11px;font-weight:600;color:#0a0a0a;">৳ ${subtotal.toLocaleString()}</span>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:400;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Shipping</span>
          <span style="font-size:11px;font-weight:600;color:#0a0a0a;">৳ ${shipping.toLocaleString()}</span>
        </div>

        ${discount > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0;background:#fff9f9;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding-left:6px;padding-right:6px;margin:0 -6px;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:500;letter-spacing:0.15em;color:#800000;text-transform:uppercase;">
            ${order.couponCode ? `Coupon · ${order.couponCode}` : 'Discount'}
          </span>
          <span style="font-size:11px;font-weight:600;color:#800000;">— ৳ ${discount.toLocaleString()}</span>
        </div>` : ''}

        <!-- Total -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;padding-top:10px;border-top:2px solid #0a0a0a;">
          <div>
            <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:400;letter-spacing:0.25em;color:#888;text-transform:uppercase;display:block;margin-bottom:2px;">Total Amount</span>
            <span style="font-family:'Oswald',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.1em;color:#0a0a0a;text-transform:uppercase;">
              ${methodLabel}
            </span>
          </div>
          <span style="font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#0a0a0a;line-height:1;">
            ৳ ${order.totalAmount.toLocaleString()}
          </span>
        </div>

        <!-- Paid / Due rows -->
        ${isPaid ? `
        <div style="margin-top:8px;background:#DEF7EC;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:600;letter-spacing:0.2em;color:#03543F;text-transform:uppercase;">✓ Amount Paid</span>
          <span style="font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#03543F;">৳ ${order.totalAmount.toLocaleString()}</span>
        </div>
        <div style="margin-top:4px;background:#f5f5f5;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:600;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Due on Delivery</span>
          <span style="font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#888;">৳ 0</span>
        </div>` : `
        <div style="margin-top:8px;background:#FDF6B2;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <span style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:600;letter-spacing:0.2em;color:#723B13;text-transform:uppercase;">Due on Delivery</span>
          <span style="font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#723B13;">৳ ${order.totalAmount.toLocaleString()}</span>
        </div>`}
      </div>
    </div>

    <!-- ── FOOTER ── -->
    <div style="border-top:1px solid #e8e8e8;padding-top:6mm;display:flex;justify-content:space-between;align-items:flex-end;">

      <!-- Stamp -->
      <div>
        <div style="display:inline-block;padding:7px 18px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;transform:rotate(-2deg);transform-origin:left center;${isPaid ? 'border:2px solid #047857;color:#047857;' : 'border:2px solid #0a0a0a;color:#0a0a0a;'}-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          ${isPaid ? '✓ PAID — ' + methodLabel : 'PAYMENT ON DELIVERY'}
        </div>
        <div style="font-size:8px;color:#ccc;letter-spacing:0.08em;text-transform:uppercase;margin-top:8px;">
          ${isPaid ? 'No further payment required.' : 'Please have the exact amount ready at delivery.'}
        </div>
      </div>

      <!-- Auth block -->
      <div style="text-align:right;">
        <span style="font-family:'Oswald',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.18em;color:#0a0a0a;text-transform:uppercase;display:block;margin-bottom:3px;">
          System Generated
        </span>
        <span style="font-size:8px;color:#aaa;letter-spacing:0.06em;text-transform:uppercase;display:block;">
          Electronic Authentication
        </span>
      </div>
    </div>

    <!-- Copyright -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5mm;padding-top:4mm;border-top:1px solid #f0f0f0;">
      <span style="font-size:7.5px;color:#ccc;letter-spacing:0.12em;text-transform:uppercase;font-family:'Oswald',sans-serif;font-weight:300;">
        © ${new Date().getFullYear()} OURA Lifestyle. All Rights Reserved.
      </span>
      <span style="font-size:7.5px;color:#ccc;letter-spacing:0.12em;text-transform:uppercase;font-family:'Oswald',sans-serif;font-weight:300;">
        Engineered for the Modern Aesthetic
      </span>
    </div>

  </div><!-- /page body -->

  <!-- BOTTOM BAR -->
  <div style="width:100%;height:5px;background:#800000;position:absolute;bottom:0;left:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

</div><!-- /page -->

</body>
</html>`;
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { _previewOnly, ...order } = body;

    const logoPath   = path.join(process.cwd(), 'public', 'logo.png');
    const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

    const html = buildInvoiceHTML(order, logoBase64);

    // Preview mode — return raw HTML so the modal can render it in an iframe
    if (_previewOnly) {
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // PDF mode — run Puppeteer
    const orderRef = order.orderId || ('#' + (order._id?.slice(-6) ?? 'REF').toUpperCase());

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OURA_Invoice_${orderRef}.pdf"`,
      },
    });

  } catch (error) {
    console.error('[Invoice] Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
