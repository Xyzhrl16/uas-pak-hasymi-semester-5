import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  X,
  CreditCard,
  Printer,
  Eye,
  EyeOff,
  Download,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '../services/storage';
import { BusinessProfile } from '../types';
import { buildQrisPayload, renderQrisToCanvas, getQrisDataUrl } from '../services/qris';

interface QrisPaymentCardProps {
  amount: number;
  profile: BusinessProfile;
  invoiceNumber?: string;
  customerName?: string;
  onPaymentConfirmed?: () => void;
  isConfirmed?: boolean;
  compact?: boolean;
}

export const QrisPaymentCard: React.FC<QrisPaymentCardProps> = ({
  amount,
  profile,
  invoiceNumber,
  customerName,
  onPaymentConfirmed,
  isConfirmed = false,
  compact = false,
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 mins
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const merchantName = profile.qrisMerchantName || profile.name.toUpperCase();
  const nmid = profile.qrisNmid || 'ID1024356789123';

  // Build compliant Indonesian QRIS EMVCo string payload
  const qrisPayloadString = buildQrisPayload({
    nmid,
    merchantName,
    amount,
    invoiceNumber: invoiceNumber || 'POS-INV',
    city: 'JAWA TENGAH',
    postalCode: '57211',
  });

  // Render QR Code onto canvas
  useEffect(() => {
    let isMounted = true;
    if (canvasRef.current) {
      renderQrisToCanvas(canvasRef.current, qrisPayloadString, compact ? 190 : 230).catch(console.error);
    }
    getQrisDataUrl(qrisPayloadString, 350)
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [qrisPayloadString, compact]);

  // Render in fullscreen modal
  useEffect(() => {
    if (showFullscreen && modalCanvasRef.current) {
      renderQrisToCanvas(modalCanvasRef.current, qrisPayloadString, 280).catch(console.error);
    }
  }, [showFullscreen, qrisPayloadString]);

  // Countdown timer
  useEffect(() => {
    if (isConfirmed) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isConfirmed]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrisPayloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleCopyNmid = () => {
    navigator.clipboard.writeText(nmid);
    setCopiedNmid(true);
    setTimeout(() => setCopiedNmid(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QRIS-${merchantName.replace(/\s+/g, '-')}-${amount || 'standee'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-red-500 shadow-md overflow-hidden text-slate-800 transition-all">
      {/* Official Indonesian QRIS Red Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-red-600 font-black px-2 py-0.5 rounded-md text-xs tracking-wider shadow-xs border border-red-200">
            QRIS
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block leading-none">
              KODE QRIS STANDAR PEMBAYARAN
            </span>
            <span className="text-[9px] text-red-100 font-medium">
              Scan untuk Membayar via Semua E-Wallet & Bank
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowFullscreen(true)}
            className="p-1.5 hover:bg-red-800/80 rounded-lg text-white transition-colors flex items-center gap-1 text-[11px] font-semibold bg-red-700/60"
            title="Tampilkan Layar Penuh untuk Pelanggan"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Merchant Details Box */}
      <div className="px-4 pt-3 pb-2 text-center border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Nama Merchant Resmi:</span>
        </div>
        <h4 className="font-black text-sm text-slate-900 tracking-tight uppercase mt-0.5">
          {merchantName}
        </h4>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            NMID: <strong className="text-slate-900">{nmid}</strong>
          </span>
          <button
            type="button"
            onClick={handleCopyNmid}
            className="text-[10px] text-red-700 hover:text-red-800 font-bold underline transition-colors"
          >
            {copiedNmid ? 'Tersalin!' : 'Salin NMID'}
          </button>
        </div>
      </div>

      {/* Main QR Code & Amount */}
      <div className="p-4 flex flex-col items-center justify-center space-y-3 bg-white">
        {/* Scannable Real QR Canvas */}
        <div className="relative p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="rounded-lg select-none block max-w-full"
            />
            {/* Center QRIS logo badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-1 rounded-md shadow-md border border-slate-200">
                <div className="bg-red-600 text-white font-black text-[9px] px-1 py-0.5 rounded leading-none">
                  QRIS
                </div>
              </div>
            </div>
          </div>

          {/* Success Overlay if Confirmed */}
          {isConfirmed && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-4 space-y-1 z-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <span className="font-black text-sm tracking-wide">PEMBAYARAN DITERIMA!</span>
              <span className="text-[11px] text-emerald-200 text-center">
                Dana QRIS telah berhasil masuk kas toko
              </span>
            </div>
          )}
        </div>

        {/* Amount Box */}
        <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-xs space-y-0.5">
          <span className="text-[11px] text-slate-500 font-medium block">Nominal Tagihan QRIS:</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
            {formatRupiah(amount)}
          </div>
          {customerName && (
            <div className="text-[10px] text-slate-500 pt-0.5">
              Atas Nama: <strong className="text-slate-800">{customerName}</strong>
            </div>
          )}
        </div>

        {/* Status & Live Countdown */}
        {!isConfirmed ? (
          <div className="flex items-center justify-between w-full text-[11px] bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />
              Menunggu Pembeli Scan Kode
            </span>
            <span className="font-mono font-bold text-amber-800">Kadaluarsa: {timeFormatted}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full text-xs text-emerald-800 font-bold bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            QRIS Terverifikasi Berhasil (Lunas)
          </div>
        )}

        {/* Action Buttons: Confirm scan, Copy, Download */}
        <div className="w-full grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyPayload}
            className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            title="Salin String Kode QRIS Standar (EMVCo)"
          >
            {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPayload ? 'Kode Tersalin!' : 'Salin Kode QRIS'}</span>
          </button>

          <button
            type="button"
            onClick={onPaymentConfirmed}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isConfirmed
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isConfirmed ? 'Sudah Lunas ✅' : 'Konfirmasi Bayar'}</span>
          </button>
        </div>

        {/* Raw Payload Accordion for Transparent Inspection */}
        <div className="w-full text-left">
          <button
            type="button"
            onClick={() => setShowRawPayload(!showRawPayload)}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 font-mono transition-colors"
          >
            {showRawPayload ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showRawPayload ? 'Sembunyikan Teks Kode QRIS' : 'Tampilkan Teks Kode QRIS (String)'}</span>
          </button>

          {showRawPayload && (
            <div className="mt-1 p-2 bg-slate-900 rounded-lg text-[9px] font-mono text-emerald-400 break-all border border-slate-800 shadow-inner">
              <div className="text-slate-400 text-[8px] mb-1 font-sans">
                EMVCo QRIS Payload Nasional (Dapat dibaca oleh semua aplikasi perbankan):
              </div>
              {qrisPayloadString}
            </div>
          )}
        </div>

        {/* Supported Banks & E-Wallets Logo Badges */}
        <div className="w-full pt-2 border-t border-slate-200 text-center space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
            Mendukung Seluruh Pembayaran Digital Indonesia
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-700 font-bold">
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-blue-700 font-mono">BCA</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-blue-900 font-mono">BRImo</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-yellow-700 font-mono">Livin' Mandiri</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-teal-700 font-mono">BSI Mobile</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-sky-700 font-mono">GoPay</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-mono">OVO</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-blue-600 font-mono">DANA</span>
            <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-orange-600 font-mono">ShopeePay</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Standee Modal for Customer facing presentation */}
      {showFullscreen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-red-500 relative space-y-4">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="flex flex-col items-center">
              <div className="bg-red-600 text-white font-black text-2xl px-5 py-1 rounded-xl tracking-wider mb-1 shadow-xs">
                QRIS
              </div>
              <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                PEMBAYARAN DIGITAL STANDAR NASIONAL
              </span>
              <h3 className="font-black text-base text-slate-900 mt-2 uppercase">{merchantName}</h3>
              <p className="text-xs text-slate-500 font-mono">NMID: {nmid}</p>
            </div>

            {/* Large Canvas QR Code */}
            <div className="flex justify-center py-2 relative">
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-md">
                <canvas ref={modalCanvasRef} className="rounded-lg block select-none" />
              </div>
            </div>

            {/* Big Amount */}
            <div className="bg-emerald-50 border-2 border-emerald-200 p-3 rounded-2xl">
              <span className="text-xs text-slate-500 font-medium block">Nominal Tagihan:</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                {formatRupiah(amount)}
              </div>
              {customerName && (
                <span className="text-xs text-slate-600 font-semibold block mt-0.5">
                  Pelanggan: {customerName}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-snug">
              Buka aplikasi Bank atau E-Wallet apa saja, pilih <strong>Scan QRIS</strong>, dan arahkan kamera ke kode di atas.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Gambar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onPaymentConfirmed) onPaymentConfirmed();
                  setShowFullscreen(false);
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sudah Bayar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
