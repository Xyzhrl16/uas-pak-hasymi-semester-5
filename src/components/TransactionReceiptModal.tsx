import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Receipt,
  MessageCircle,
  QrCode,
  Smartphone,
  Layers,
  Sparkles,
  CheckCircle2,
  Settings2,
} from 'lucide-react';
import {
  SaleTransaction,
  PurchaseTransaction,
  MillingTransaction,
  BusinessProfile,
} from '../types';
import {
  formatRupiah,
  formatWeight,
  formatDateIndo,
  generateSaleWhatsAppText,
  generatePurchaseWhatsAppText,
  generateMillingWhatsAppText,
} from '../services/storage';
import { buildQrisPayload, getQrisDataUrl } from '../services/qris';
import {
  printReceiptElement,
  generatePlainTextReceipt,
  printViaRawBt,
} from '../services/printService';

export type ReceiptTransaction =
  | { type: 'sale'; data: SaleTransaction }
  | { type: 'purchase'; data: PurchaseTransaction }
  | { type: 'milling'; data: MillingTransaction };

interface TransactionReceiptModalProps {
  transaction: ReceiptTransaction | null;
  profile: BusinessProfile;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  profile,
  onClose,
}) => {
  const [activeOutputTab, setActiveOutputTab] = useState<'thermal' | 'whatsapp' | 'text'>('thermal');
  const [copied, setCopied] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>('');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    profile.printerPaperWidth || '58mm'
  );
  const [copies, setCopies] = useState<1 | 2>(profile.printCopies || 1);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(
    profile.autoPrintReceipt ?? true
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatusText, setPrintStatusText] = useState<string>('');
  const hasAutoPrintedRef = useRef<boolean>(false);

  // Generate QRIS Data URL if paid by QRIS
  useEffect(() => {
    if (!transaction) return;
    const isQris =
      (transaction.type === 'sale' && transaction.data.paymentMethod === 'qris') ||
      (transaction.type === 'milling' && transaction.data.paymentMethod === 'qris');

    if (isQris) {
      const amount =
        transaction.type === 'sale'
          ? transaction.data.finalTotal
          : transaction.data.cashFeeTotal || 0;
      const payload = buildQrisPayload({
        nmid: profile.qrisNmid || 'ID1024356789123',
        merchantName: profile.qrisMerchantName || profile.name,
        amount,
        invoiceNumber: transaction.data.invoiceNumber,
      });
      getQrisDataUrl(payload, 160).then(setReceiptQrUrl).catch(console.error);
    } else {
      setReceiptQrUrl('');
    }
  }, [transaction, profile]);

  // Auto-print effect when modal opens
  useEffect(() => {
    if (!transaction) {
      hasAutoPrintedRef.current = false;
      return;
    }

    if (autoPrintEnabled && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      setPrintStatusText('Menyiapkan cetak struk otomatis...');
      const timer = setTimeout(() => {
        handleExecutePrint();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [transaction, autoPrintEnabled, paperWidth, copies]);

  // Listen for Ctrl+P or Enter to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!transaction) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleExecutePrint();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, paperWidth, copies]);

  if (!transaction) return null;

  // Generate appropriate WhatsApp & Plain text
  let waText = '';
  let customerPhone = '';
  let transactionTitle = '';
  let invoiceCode = '';

  if (transaction.type === 'sale') {
    waText = generateSaleWhatsAppText(transaction.data, profile);
    customerPhone = transaction.data.customerPhone || '';
    transactionTitle = 'Penjualan Beras & Dedak';
    invoiceCode = transaction.data.invoiceNumber;
  } else if (transaction.type === 'purchase') {
    waText = generatePurchaseWhatsAppText(transaction.data, profile);
    customerPhone = transaction.data.supplierPhone || '';
    transactionTitle = 'Pembelian & Timbangan Gabah';
    invoiceCode = transaction.data.invoiceNumber;
  } else if (transaction.type === 'milling') {
    waText = generateMillingWhatsAppText(transaction.data, profile);
    customerPhone = transaction.data.customerPhone || '';
    transactionTitle = 'Layanan Jasa Giling Padi';
    invoiceCode = transaction.data.invoiceNumber;
  }

  const plainTextReceipt = generatePlainTextReceipt(transaction, profile, paperWidth);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(plainTextReceipt);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank');
  };

  const handleExecutePrint = async (targetCopies?: 1 | 2) => {
    setIsPrinting(true);
    setPrintStatusText('Membuka dialog cetak struk thermal...');
    try {
      await printReceiptElement('printable-receipt', {
        paperWidth,
        copies: targetCopies || copies,
        title: `Struk_${invoiceCode}`,
      });
      setPrintStatusText('Perintah cetak berhasil dikirim ke printer!');
    } catch (err) {
      console.error('Print failed:', err);
      // Fallback
      window.print();
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintStatusText(''), 3500);
    }
  };

  const handlePrintBluetoothRawBt = () => {
    printViaRawBt(plainTextReceipt);
    setPrintStatusText('Meneruskan nota ke RawBT / Printer Bluetooth...');
    setTimeout(() => setPrintStatusText(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">Transaksi Berhasil Disetujui</h3>
                <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                  TERSIMPAN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {transactionTitle} • <span className="font-mono text-slate-300">{invoiceCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Options for Thermal Printer */}
        <div className="bg-slate-800/90 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 text-xs no-print">
          <div className="flex items-center gap-3">
            {/* Paper Size */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
              <span className="text-[11px] text-slate-400 font-semibold">Kertas:</span>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  paperWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                58 mm (Mini/BT)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  paperWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                80 mm (POS)
              </button>
            </div>

            {/* Copies */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
              <span className="text-[11px] text-slate-400 font-semibold">Rangkap:</span>
              <button
                type="button"
                onClick={() => setCopies(1)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  copies === 1 ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => setCopies(2)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  copies === 2 ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
                title="1 untuk Pelanggan, 1 untuk Arsip Kilang"
              >
                2x (Arsip)
              </button>
            </div>
          </div>

          {/* Auto-print toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700 hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => setAutoPrintEnabled(e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-[11px] font-medium text-slate-200">
              Cetak Otomatis Setiap Transaksi
            </span>
          </label>
        </div>

        {/* Status notification if printing */}
        {printStatusText && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-800 flex items-center justify-between no-print animate-fade-in">
            <div className="flex items-center gap-1.5 font-medium">
              <Printer className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{printStatusText}</span>
            </div>
            <button
              onClick={() => setPrintStatusText('')}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switcher: Thermal Struk vs WhatsApp Note vs Plain Text */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2.5 gap-2 no-print">
          <button
            onClick={() => setActiveOutputTab('thermal')}
            className={`flex items-center gap-2 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeOutputTab === 'thermal'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Format Struk Thermal ({paperWidth})</span>
          </button>

          <button
            onClick={() => setActiveOutputTab('whatsapp')}
            className={`flex items-center gap-2 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeOutputTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Draf WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveOutputTab('text')}
            className={`flex items-center gap-2 pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeOutputTab === 'text'
                ? 'border-indigo-600 text-indigo-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Teks Bluetooth / RawBT</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          {activeOutputTab === 'thermal' ? (
            /* Printable Thermal Receipt Mockup */
            <div
              id="printable-receipt"
              className={`bg-white p-5 sm:p-6 shadow-md rounded-lg font-mono text-xs text-slate-900 border border-slate-200 relative select-text transition-all ${
                paperWidth === '80mm' ? 'max-w-[80mm] w-full paper-80mm text-[12px]' : 'max-w-[58mm] w-full paper-58mm text-[10.5px]'
              }`}
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-900">{profile.name}</h4>
                <p className="text-[10px] text-slate-600 mt-0.5">{profile.tagline}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{profile.address}</p>
                <p className="text-[10px] text-slate-500 font-sans">Telp/WA: {profile.phone}</p>
              </div>

              {/* Transaction Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Nota:</span>
                  <span className="font-bold">{invoiceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{formatDateIndo(transaction.data.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {transaction.type === 'purchase' ? 'Petani/Mitra:' : 'Pelanggan:'}
                  </span>
                  <span className="font-semibold text-right">
                    {transaction.type === 'sale'
                      ? transaction.data.customerName || 'Pelanggan Umum'
                      : transaction.type === 'purchase'
                      ? transaction.data.supplierName
                      : transaction.data.customerName || 'Petani'}
                  </span>
                </div>
              </div>

              {/* Specific Items Breakdown */}
              <div className="py-3 border-b border-dashed border-slate-400">
                {transaction.type === 'sale' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="font-bold text-slate-700 flex justify-between border-b border-dashed pb-1">
                      <span>Item Barang</span>
                      <span>Total</span>
                    </div>
                    {transaction.data.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>
                            {item.quantity} x {formatRupiah(item.pricePerUnit)}
                          </span>
                          <span className="font-mono font-bold">{formatRupiah(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {transaction.type === 'purchase' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="font-bold text-slate-900 mb-1">{transaction.data.itemName}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bruto ({transaction.data.rafaksi.bagCount} Karung):</span>
                      <span>{formatWeight(transaction.data.rafaksi.grossWeightKg)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Potongan Tara Karung:</span>
                      <span>-{formatWeight(transaction.data.rafaksi.totalTareKg)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>
                        Rafaksi (KA {transaction.data.rafaksi.moisturePercent}% + Hampa):
                      </span>
                      <span>
                        -{transaction.data.rafaksi.totalRafaksiPercent}% (-
                        {formatWeight(transaction.data.rafaksi.totalRafaksiKg)})
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                      <span>Berat Bersih (Netto):</span>
                      <span className="text-emerald-800 font-mono font-bold">{formatWeight(transaction.data.rafaksi.netWeightKg)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Harga per Kg:</span>
                      <span>{formatRupiah(transaction.data.pricePerKg)}</span>
                    </div>
                  </div>
                )}

                {transaction.type === 'milling' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gabah Masuk:</span>
                      <span className="font-bold">{formatWeight(transaction.data.grainWeightKg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Skema Ongkos:</span>
                      <span className="font-semibold text-slate-800">
                        {transaction.data.scheme === 'upah_tunai'
                          ? `Upah Tunai (${formatRupiah(transaction.data.feePerKg || 0)}/kg)`
                          : transaction.data.scheme === 'potong_hasil_dedak'
                          ? 'Potong Dedak/Bawon'
                          : 'Potong Beras'}
                      </span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-slate-200 text-[10px] space-y-1">
                      <div className="font-bold text-slate-700">Hasil Giling Dibawa Pulang Petani:</div>
                      <div className="flex justify-between text-emerald-800">
                        <span>• Beras Bersih:</span>
                        <span className="font-bold">{formatWeight(transaction.data.customerTakeRiceKg)}</span>
                      </div>
                      <div className="flex justify-between text-amber-800">
                        <span>• Dedak / Katul:</span>
                        <span className="font-bold">{formatWeight(transaction.data.customerTakeBranKg)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>• Menir:</span>
                        <span>{formatWeight(transaction.data.customerTakeMenirKg)}</span>
                      </div>
                      {transaction.data.deductionBranKg && transaction.data.deductionBranKg > 0 && (
                        <div className="flex justify-between text-indigo-700 pt-0.5">
                          <span>• Dedak Tinggal di Kilang (Upah):</span>
                          <span className="font-bold">{formatWeight(transaction.data.deductionBranKg)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Totals & Payments */}
              <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                {transaction.type === 'sale' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(transaction.data.subtotal)}</span>
                    </div>
                    {transaction.data.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Diskon:</span>
                        <span>-{formatRupiah(transaction.data.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(transaction.data.finalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Metode Bayar:</span>
                      <span className="uppercase font-bold">{transaction.data.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Nominal Bayar:</span>
                      <span>{formatRupiah(transaction.data.paidAmount)}</span>
                    </div>
                    {transaction.data.changeAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Kembalian:</span>
                        <span>{formatRupiah(transaction.data.changeAmount)}</span>
                      </div>
                    )}
                    {transaction.data.remainingDue > 0 && (
                      <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1 rounded">
                        <span>Sisa Kasbon (Tempo):</span>
                        <span>{formatRupiah(transaction.data.remainingDue)}</span>
                      </div>
                    )}
                  </>
                )}

                {transaction.type === 'purchase' && (
                  <>
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                      <span>TOTAL PEMBELIAN:</span>
                      <span>{formatRupiah(transaction.data.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Dibayarkan:</span>
                      <span>{formatRupiah(transaction.data.paidAmount)}</span>
                    </div>
                    {transaction.data.remainingDebt > 0 && (
                      <div className="flex justify-between text-red-700 font-bold bg-red-50 p-1 rounded">
                        <span>Sisa Utang Usaha:</span>
                        <span>{formatRupiah(transaction.data.remainingDebt)}</span>
                      </div>
                    )}
                  </>
                )}

                {transaction.type === 'milling' && (
                  <>
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                      <span>BIAYA GILING:</span>
                      <span>
                        {transaction.data.scheme === 'upah_tunai'
                          ? formatRupiah(transaction.data.cashFeeTotal || 0)
                          : 'Bawon / Potong Dedak'}
                      </span>
                    </div>
                    {transaction.data.scheme === 'upah_tunai' && (
                      <div className="flex justify-between text-slate-600">
                        <span>Metode Bayar:</span>
                        <span className="font-bold uppercase">
                          {transaction.data.paymentMethod || 'Tunai'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Status:</span>
                      <span className="font-bold uppercase">
                        {transaction.data.paymentStatus === 'lunas' ? 'LUNAS' : 'KASBON'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* QRIS Verification Badge on Receipt if paid via QRIS */}
              {receiptQrUrl && profile.showQrisOnReceipt !== false && (
                <div className="pt-3 pb-2 text-center border-b border-dashed border-slate-400 flex flex-col items-center">
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1 justify-center">
                    <QrCode className="w-3 h-3 text-red-600 inline" />
                    <span>BUKTI RESMI QRIS NASIONAL</span>
                  </div>
                  <img
                    src={receiptQrUrl}
                    alt="Kode QRIS Transaksi"
                    className="w-24 h-24 mx-auto border border-slate-300 p-1 rounded bg-white"
                  />
                  <div className="text-[8px] font-mono text-slate-500 mt-1">
                    NMID: {profile.qrisNmid || 'ID1024356789123'}
                  </div>
                </div>
              )}

              {/* Receipt Footer */}
              <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
                <p className="font-sans italic">{profile.receiptFooter}</p>
                <p className="font-mono text-[9px] text-slate-400">Dicetak: {new Date().toLocaleTimeString('id-ID')}</p>
              </div>
            </div>
          ) : activeOutputTab === 'whatsapp' ? (
            /* WhatsApp Draft Message Preview */
            <div className="w-full max-w-lg bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Format Pesan Siap Kirim ke WhatsApp
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">
                  {customerPhone ? `Tujuan: ${customerPhone}` : 'No. HP belum diisi'}
                </span>
              </div>

              <div className="bg-white rounded-lg p-3 text-xs font-mono text-slate-800 border border-emerald-100 whitespace-pre-wrap leading-relaxed shadow-xs flex-1 overflow-y-auto max-h-[350px]">
                {waText}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Teks Berhasil Disalin!' : 'Salin Draf Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </button>
              </div>
            </div>
          ) : (
            /* Plain Text Preview for Bluetooth / RawBT */
            <div className="w-full max-w-lg bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Teks Struk Bluetooth (RawBT / Mobile ESC/POS)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Lebar: {paperWidth}
                </span>
              </div>

              <pre className="bg-slate-950 rounded-lg p-3 text-[11px] font-mono text-emerald-300 border border-slate-800 whitespace-pre leading-snug overflow-x-auto flex-1 max-h-[340px]">
                {plainTextReceipt}
              </pre>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRawText}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  {copiedRawText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRawText ? 'Teks Struk Tersalin!' : 'Salin Format Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintBluetoothRawBt}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Kirim ke RawBT / Printer BT</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            Selesai / Tutup
          </button>

          <div className="flex items-center gap-2">
            {/* Direct Thermal Print Button */}
            <button
              onClick={() => handleExecutePrint(1)}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all"
              title="Shortcut: Tekan Enter atau Ctrl+P"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{isPrinting ? 'Mencetak...' : `Cetak Struk (${paperWidth})`}</span>
            </button>

            {/* 2 Copies Button */}
            <button
              onClick={() => handleExecutePrint(2)}
              disabled={isPrinting}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-colors"
              title="Cetak 2 Lembar: 1 Pelanggan + 1 Arsip"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2 Rangkap</span>
            </button>

            {/* Direct Bluetooth / RawBT Button */}
            <button
              onClick={handlePrintBluetoothRawBt}
              className="hidden md:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              title="Cetak via Printer Bluetooth di HP/Tablet Android"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Bluetooth</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
