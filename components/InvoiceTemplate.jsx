'use client';

import { useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

/* ---------------- ASSETS ---------------- */
export const AnaqaLogo = ({ className = "h-12 w-auto", fill = "currentColor" }) => (
  <svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" className={className}>
    <text
      x="50%"
      y="48"
      fontFamily="'Bodoni Moda', serif"
      fontSize="52"
      fontWeight="700"
      fill={fill}
      letterSpacing="0.02em"
      textAnchor="middle"
    >
      ANAQA
    </text>
  </svg>
);

const Taka = () => <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold' }}>৳</span>;

export default function InvoiceModal({ order, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  /* ---------------- SERVER-SIDE DOWNLOAD HANDLER ---------------- */
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Call the API route we created
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (!response.ok) throw new Error('Server PDF Generation Failed');

      // Create Blob from PDF stream
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANAQA_Invoice_${order.orderId || 'REF'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!order) return null;

  // --- DATA PREP ---
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = order.shippingAddress?.method === 'outside' ? 150 : 80;
  const total = subtotal + shipping;
  const discount = total - order.totalAmount;
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  // --- SHARED STYLES (MATCHING SERVER API) ---
  const s = {
    container: { backgroundColor: '#fffdf9', color: '#1a1a1a' },
    goldText: { color: '#C5A028' },
    goldBorder: { borderColor: '#C5A028' },
    grayText: { color: '#6B7280' },
    lightBorder: { borderColor: '#E5E7EB' },
    blackBorder: { borderColor: '#1a1a1a' },
    bgGold: { backgroundColor: '#C5A028' }
  };

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-start pt-10 md:pt-16 bg-black/90 backdrop-blur-xl overflow-hidden">
      
      {/* FONTS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&family=Bodoni+Moda:wght@400;700;900&display=swap');
        .font-barcode { font-family: 'Libre Barcode 39 Text', cursive; }
        .font-serif { font-family: 'Bodoni Moda', serif; }
      `}</style>

      {/* HEADER ACTIONS */}
      <div className="absolute top-0 left-0 w-full h-20 flex justify-end items-center px-8 z-50">
        <div className="flex gap-4">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg disabled:opacity-50"
          >
             {isDownloading ? <Loader2 className="animate-spin" size={14}/> : <Download size={14} />}
             <span>{isDownloading ? 'GENERATING PDF...' : 'DOWNLOAD RECEIPT'}</span>
          </button>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white bg-white/10 rounded-full transition-colors">
             <X size={20} />
          </button>
        </div>
      </div>

      {/* --- PREVIEW CANVAS (Exact Match to PDF) --- */}
      <div className="w-full h-full overflow-y-auto flex justify-center items-start pt-12 pb-32 relative z-10 custom-scrollbar">
        
        <div 
          className="relative w-[210mm] min-h-[297mm] shadow-2xl flex flex-col"
          style={{ 
            ...s.container, 
            padding: '15mm 15mm 10mm 15mm',
            // Subtle Pattern
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4af37' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}
        >
          
          {/* HEADER */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-[48px] font-bold m-0 leading-none tracking-tight text-black mb-4">ANAQA</h1>
            
            <div className="flex justify-center items-center gap-4 mb-8">
               <div className="h-[1px] w-12" style={s.bgGold}></div>
               <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={s.goldText}>Official Receipt</span>
               <div className="h-[1px] w-12" style={s.bgGold}></div>
            </div>

            <div className="inline-block border-[1.5px] px-8 py-4 relative mx-auto w-[80%]" style={s.blackBorder}>
               {/* Corners */}
               <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2" style={s.goldBorder}></div>
               <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2" style={s.goldBorder}></div>
               <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2" style={s.goldBorder}></div>
               <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2" style={s.goldBorder}></div>

               <div className="flex justify-between items-center">
                  <div className="text-left">
                     <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={s.grayText}>Order Ref.</span>
                     <span className="font-mono text-xl font-bold">#{order.orderId || order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={s.grayText}>Issued Date</span>
                     <span className="font-mono text-xl font-bold">{dateStr}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* ADDRESSES */}
          <div className="flex justify-between items-start mb-12 py-6 border-t border-b border-dashed" style={s.lightBorder}>
             <div className="w-[45%]">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 bg-black rotate-45"></div>
                   <h3 className="text-[9px] font-bold uppercase tracking-[0.2em]" style={s.grayText}>Billed To</h3>
                </div>
                <p className="font-serif text-xl mb-3 text-black">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                <div className="text-[10px] leading-relaxed uppercase tracking-wide pl-3 border-l-2" style={{ ...s.grayText, ...s.lightBorder }}>
                   <p>{order.shippingAddress?.address}</p>
                   <p>{order.shippingAddress?.city} - {order.shippingAddress?.postalCode}</p>
                   <p className="mt-1 font-mono text-black font-bold">{order.guestInfo?.phone}</p>
                </div>
             </div>

             <div className="w-[45%] text-right">
                <div className="flex items-center gap-2 mb-3 justify-end">
                   <h3 className="text-[9px] font-bold uppercase tracking-[0.2em]" style={s.grayText}>From</h3>
                   <div className="w-1.5 h-1.5 rotate-45" style={s.bgGold}></div>
                </div>
                <p className="font-serif text-xl mb-3 text-black">ANAQA Sanctuary</p>
                <div className="text-[10px] leading-relaxed uppercase tracking-wide pr-3 border-r-2" style={{ ...s.grayText, ...s.goldBorder }}>
                   <p>128, Gulshan Avenue</p>
                   <p>Dhaka, Bangladesh</p>
                   <p className="mt-1 font-mono text-black lowercase">concierge@anaqa.com</p>
                </div>
             </div>
          </div>

          {/* TABLE (Fills remaining space) */}
          <div className="mb-12 flex-grow">
             <table className="w-full border-collapse">
                <thead>
                   <tr className="border-b-2" style={s.blackBorder}>
                      <th className="text-left py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-black">Item Details</th>
                      <th className="text-center py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-black">Size</th>
                      <th className="text-center py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-black">Qty</th>
                      <th className="text-right py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-black">Price</th>
                   </tr>
                </thead>
                <tbody>
                   {order.items.map((item, i) => (
                      <tr key={i} className="border-b border-dashed" style={s.lightBorder}>
                         <td className="py-4 pr-4">
                            <p className="font-bold text-xs mb-1 uppercase tracking-wide text-black">{item.name}</p>
                            <div className="flex items-center gap-2 opacity-80">
                               {item.sku && <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">SKU: {item.sku}</span>}
                               {item.barcode && <span className="font-barcode text-2xl leading-none text-black ml-1">*{item.barcode}*</span>}
                            </div>
                         </td>
                         <td className="text-center py-4 text-xs font-bold text-black">{item.size || '-'}</td>
                         <td className="text-center py-4 text-xs font-bold text-black">{item.quantity}</td>
                         <td className="text-right py-4 text-xs font-bold text-black"><Taka/> {(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* TOTALS */}
          <div className="flex justify-end mb-16">
             <div className="w-[320px] bg-[#fafafa] p-5 border relative" style={s.lightBorder}>
                <div className="absolute top-0 right-0 w-1 h-full" style={s.bgGold}></div>
                
                <div className="space-y-2 mb-4">
                   <div className="flex justify-between text-[10px] uppercase tracking-wide" style={s.grayText}>
                      <span>Subtotal</span>
                      <span className="font-bold text-black"><Taka/> {subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-[10px] uppercase tracking-wide" style={s.grayText}>
                      <span>Shipping</span>
                      <span className="font-bold text-black"><Taka/> {shipping.toLocaleString()}</span>
                   </div>
                   {discount > 0 && (
                      <div className="flex justify-between text-[10px] uppercase tracking-wide text-black font-bold">
                         <span>Discount</span>
                         <span>- <Taka/> {Math.abs(discount).toLocaleString()}</span>
                      </div>
                   )}
                </div>
                
                <div className="border-t-2 pt-3 mt-3 flex justify-between items-end" style={s.blackBorder}>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-black">Total</span>
                    <span className="font-serif text-3xl font-bold text-black" style={{ lineHeight: 1 }}>
                      <Taka/> {order.totalAmount.toLocaleString()}
                    </span>
                </div>
             </div>
          </div>

          {/* FOOTER */}
          <div className="mt-auto">
             <div className="flex items-end justify-between pb-4 border-b" style={s.blackBorder}>
                <div style={{ transform: 'rotate(-2deg)' }} className={`border-2 px-5 py-2 font-bold tracking-widest text-[11px] uppercase inline-block ${order.status === 'Delivered' ? 'border-green-700 text-green-700' : 'border-black text-black'}`}>
                    {order.status === 'Delivered' ? 'PAID' : 'PAYMENT DUE (COD)'}
                </div>

                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-black">System Generated</p>
                   <p className="text-[8px] uppercase tracking-widest" style={s.grayText}>Electronic Authentication</p>
                </div>
             </div>

             <div className="pt-3 flex justify-between items-center text-[8px] uppercase tracking-widest" style={s.grayText}>
                <p>Terms: Non-refundable. Exchange within 7 days.</p>
                <p>© {new Date().getFullYear()} ANAQA. All Rights Reserved.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}