'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';

export default function InvoiceModal({ order, onClose }) {
  const [previewHtml, setPreviewHtml]   = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [downloading, setDownloading]   = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const iframeRef = useRef(null);

  // Fetch the preview HTML from the same endpoint the PDF uses
  useEffect(() => {
    if (!order) return;
    setLoadingPreview(true);
    setPreviewError(false);

    fetch('/api/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...order, _previewOnly: true }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Preview failed');
        return res.text();
      })
      .then(html => {
        setPreviewHtml(html);
        setLoadingPreview(false);
      })
      .catch(() => {
        setPreviewError(true);
        setLoadingPreview(false);
      });
  }, [order]);

  // Auto-size iframe to its content height once loaded
  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        if (h > 0) iframeRef.current.style.height = `${h + 2}px`;
      }
    } catch {
      // cross-origin guard — won't happen with srcdoc
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `OURA_Invoice_${order.orderId || 'REF'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Invoice] Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0a0a]">

      {/* ── ACTION BAR ── */}
      <div className="flex-shrink-0 flex justify-between items-center px-6 h-16 border-b border-white/10 bg-[#0a0a0a]">

        <div className="flex items-center gap-3">
          <FileText size={16} className="text-[#800000]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white leading-none">
              Invoice Preview
            </p>
            <p className="text-[9px] text-white/30 tracking-widest uppercase mt-0.5 leading-none">
              {order.orderId || 'Draft'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading || loadingPreview}
            className="flex items-center gap-2 bg-[#800000] hover:bg-white hover:text-black text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloading
              ? <Loader2 size={13} className="animate-spin" />
              : <Download size={13} />}
            <span>{downloading ? 'Generating PDF…' : 'Download PDF'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── PREVIEW AREA ── */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a1a] flex justify-center items-start py-8 px-4">

        {loadingPreview && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="animate-spin text-[#800000]" size={36} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
              Rendering Invoice…
            </span>
          </div>
        )}

        {previewError && !loadingPreview && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
              Preview unavailable
            </p>
            <p className="text-white/20 text-xs tracking-wide">
              You can still download the PDF.
            </p>
          </div>
        )}

        {previewHtml && !loadingPreview && (
          /* Shadow wrapper — same width as A4 (210mm) */
          <div
            style={{ width: '210mm' }}
            className="shadow-[0_8px_60px_rgba(0,0,0,0.8)]"
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              title="Invoice Preview"
              onLoad={handleIframeLoad}
              style={{
                width: '210mm',
                minHeight: '297mm',
                height: '297mm',   /* overridden by onLoad */
                border: 'none',
                display: 'block',
                background: '#ffffff',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
