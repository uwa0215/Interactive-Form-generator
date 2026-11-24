import React, { useRef, useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function ShareQRModal({ form, onClose }) {
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef(null);

  if (!form) return null;

  const playUrl = `${window.location.origin}/play/${form.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPng = () => {
    const canvas = qrWrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a padded export canvas with title & URL caption
    const padding = 32;
    const footerHeight = 56;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.height + padding * 2 + footerHeight;

    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      form.title.slice(0, 34),
      exportCanvas.width / 2,
      canvas.height + padding + 24
    );

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(
      `/play/${form.slug}`,
      exportCanvas.width / 2,
      canvas.height + padding + 44
    );

    const link = document.createElement('a');
    link.download = `qr-${form.slug}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Share & QR Code</h2>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{form.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-5">
          <div
            ref={qrWrapperRef}
            className="p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-inner"
          >
            <QRCodeCanvas
              value={playUrl}
              size={220}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Participant Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={playUrl}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="w-full flex items-center gap-3 pt-1">
            <button
              onClick={handleDownloadPng}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              Download PNG QR
            </button>
            <a
              href={`/play/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
