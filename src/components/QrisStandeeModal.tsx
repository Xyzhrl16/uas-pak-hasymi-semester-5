import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Building2,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { buildQrisPayload, renderQrisToCanvas, getQrisDataUrl } from '../services/qris';
import { formatRupiah } from '../services/storage';

interface QrisStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
}

export const QrisStandeeModal: React.FC<QrisStandeeModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const merchantName = profile.qrisMerchantName || profile.name.toUpperCase();
  const nmid = profile.qrisNmid || 'ID1024356789123';

  const currentAmountNum = typeof customAmount === 'number' && customAmount > 0 ? customAmount : undefined;

  const payloadString = buildQrisPayload({
    nmid,
    merchantName,
    amount: currentAmountNum,
    city: 'JAWA TENGAH',
    postalCode: '57211',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (canvasRef.current) {
      renderQrisToCanvas(canvasRef.current, payloadString, 260).catch(console.error);
    }
    getQrisDataUrl(payloadString, 400)
      .then(setQrDataUrl)
      .catch(console.error);
  }, [isOpen, payloadString]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Standee-QRIS-${merchantName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 rounded-lg text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Kode QRIS Toko Resmi</h3>
              <p className="text-[11px] text-slate-400">Standee Meja Kasir & Pembayaran Digital</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Standee Body */}
        <div className="p-5 overflow-y-auto bg-slate-50 flex flex-col items-center select-text">
          <div className="bg-white rounded-2xl border-2 border-red-500 shadow-md p-5 w-full max-w-xs text-center space-y-3">
            {/* Red QRIS Header */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-2xl px-6 py-1 rounded-xl shadow-xs tracking-wider">
                QRIS
              </div>
              <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase mt-1">
                STANDAR PEMBAYARAN DIGITAL NASIONAL
              </span>
            </div>

            {/* Merchant info */}
            <div className="pt-1">
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                {merchantName}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">NMID: {nmid}</p>
            </div>

            {/* QR Canvas */}
            <div className="flex justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <canvas ref={canvasRef} className="rounded-lg block select-none" />
            </div>

            {/* Amount / Static Badge */}
            {currentAmountNum ? (
              <div className="bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block">Nominal Ditentukan:</span>
                <span className="font-mono font-black text-base text-emerald-800">
                  {formatRupiah(currentAmountNum)}
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 py-1 px-3 rounded-lg text-[10px] text-slate-600 font-semibold">
                Scan & Masukkan Nominal Sesuai Belanja Anda
              </div>
            )}

            {/* Bank Logos */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                Menerima Semua Pembayaran:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] font-mono text-slate-600 font-bold">
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-blue-700">BCA</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-blue-900">BRI</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-yellow-700">Mandiri</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-teal-700">BSI</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-sky-700">GoPay</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-blue-600">DANA</span>
                <span className="bg-slate-50 border px-1 py-0.2 rounded text-orange-600">ShopeePay</span>
              </div>
            </div>
          </div>

          {/* Quick Input for testing / setting dynamic amount */}
          <div className="w-full max-w-xs mt-4 p-3 bg-white rounded-xl border border-slate-200 space-y-2 no-print text-xs">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Set Nominal Tertentu (Opsional):
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold text-xs">Rp</span>
              <input
                type="number"
                placeholder="Kosongkan jika nominal bebas"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
              {customAmount !== '' && (
                <button
                  type="button"
                  onClick={() => setCustomAmount('')}
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between no-print">
          <button
            onClick={() => {
              navigator.clipboard.writeText(payloadString);
              setCopiedPayload(true);
              setTimeout(() => setCopiedPayload(false), 2000);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPayload ? 'Tersalin' : 'Salin Kode QRIS'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Gambar</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Standee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
