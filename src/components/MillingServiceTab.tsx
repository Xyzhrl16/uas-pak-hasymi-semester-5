import React, { useState } from 'react';
import {
  Cog,
  Wheat,
  User,
  Phone,
  Banknote,
  Repeat,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  QrCode,
  Calendar,
  Printer,
  History,
} from 'lucide-react';
import {
  MillingTransaction,
  Product,
  StockMutation,
  DebtCreditRecord,
  BusinessProfile,
  MillingScheme,
} from '../types';
import { formatRupiah, formatWeight, formatDateIndo } from '../services/storage';
import { QrisPaymentCard } from './QrisPaymentCard';

interface MillingServiceTabProps {
  profile: BusinessProfile;
  products: Product[];
  recentMilling?: MillingTransaction[];
  onCompleteMilling: (
    milling: MillingTransaction,
    updatedProducts: Product[],
    newMutations: StockMutation[],
    newReceivable?: DebtCreditRecord
  ) => void;
  onReprintReceipt?: (mil: MillingTransaction) => void;
}

export const MillingServiceTab: React.FC<MillingServiceTabProps> = ({
  profile,
  products,
  recentMilling = [],
  onCompleteMilling,
  onReprintReceipt,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [grainType, setGrainType] = useState('Gabah Kering Giling (Ciherang)');
  const [grainWeightKg, setGrainWeightKg] = useState<number>(500);

  // Scheme state
  const [scheme, setScheme] = useState<MillingScheme>('upah_tunai');
  const [feePerKg, setFeePerKg] = useState<number>(profile.cashFeeRatePerKg || 600);
  const [riceYieldPercent, setRiceYieldPercent] = useState<number>(64.0); // 64% beras
  const [branYieldPercent, setBranYieldPercent] = useState<number>(9.0); // 9% dedak
  const [menirYieldPercent, setMenirYieldPercent] = useState<number>(3.0); // 3% menir

  // Specific deduction configs
  const [riceDeductionPercent, setRiceDeductionPercent] = useState<number>(6.0); // Jika potong beras
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer' | 'kasbon'>('tunai');
  const [isQrisConfirmed, setIsQrisConfirmed] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Calculations
  const weight = grainWeightKg || 0;
  const estimatedRiceKg = Number(((weight * riceYieldPercent) / 100).toFixed(2));
  const estimatedBranKg = Number(((weight * branYieldPercent) / 100).toFixed(2));
  const estimatedMenirKg = Number(((weight * menirYieldPercent) / 100).toFixed(2));

  let cashFeeTotal = 0;
  let deductionBranKg = 0;
  let deductionRiceKg = 0;
  let customerTakeRiceKg = estimatedRiceKg;
  let customerTakeBranKg = estimatedBranKg;
  let customerTakeMenirKg = estimatedMenirKg;

  if (scheme === 'upah_tunai') {
    cashFeeTotal = Math.round(weight * feePerKg);
    // Petani brings home 100%
  } else if (scheme === 'potong_hasil_dedak') {
    // All bran taken by mill as wage
    cashFeeTotal = 0;
    deductionBranKg = estimatedBranKg;
    customerTakeBranKg = 0;
  } else if (scheme === 'potong_hasil_beras') {
    cashFeeTotal = 0;
    deductionRiceKg = Number(((estimatedRiceKg * riceDeductionPercent) / 100).toFixed(2));
    customerTakeRiceKg = Math.max(0, Number((estimatedRiceKg - deductionRiceKg).toFixed(2)));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Nama pelanggan / petani wajib diisi!');
      return;
    }
    if (weight <= 0) {
      alert('Berat gabah masuk harus lebih dari 0!');
      return;
    }
    if (scheme === 'upah_tunai' && paymentMethod === 'kasbon' && !dueDate) {
      alert('Untuk pembayaran kasbon ongkos giling, tanggal jatuh tempo wajib diisi!');
      return;
    }

    const invoiceNumber = `JG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const createdAt = new Date().toISOString();

    const currentPaymentStatus: 'lunas' | 'kasbon' = paymentMethod === 'kasbon' ? 'kasbon' : 'lunas';

    const milling: MillingTransaction = {
      id: `mil-${Date.now()}`,
      invoiceNumber,
      createdAt,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      grainType,
      grainWeightKg: weight,
      scheme,
      feePerKg: scheme === 'upah_tunai' ? feePerKg : undefined,
      cashFeeTotal,
      deductionBranKg: deductionBranKg > 0 ? deductionBranKg : undefined,
      deductionRiceKg: deductionRiceKg > 0 ? deductionRiceKg : undefined,
      estimatedRiceKg,
      estimatedBranKg,
      estimatedMenirKg,
      customerTakeRiceKg,
      customerTakeBranKg,
      customerTakeMenirKg,
      paymentStatus: currentPaymentStatus,
      paymentMethod: scheme === 'upah_tunai' ? paymentMethod : undefined,
      paidAmount: scheme === 'upah_tunai' ? (currentPaymentStatus === 'lunas' ? cashFeeTotal : 0) : 0,
      remainingDue: scheme === 'upah_tunai' && currentPaymentStatus === 'kasbon' ? cashFeeTotal : 0,
      dueDate: currentPaymentStatus === 'kasbon' ? dueDate : undefined,
      notes,
    };

    // Update stock if potong hasil
    let updatedProducts = [...products];
    const newMutations: StockMutation[] = [];

    if (scheme === 'potong_hasil_dedak' && deductionBranKg > 0) {
      // Find dedak eceran product to add stock
      updatedProducts = updatedProducts.map((p) => {
        if (p.category === 'dedak' && p.unit === 'kg') {
          return {
            ...p,
            stockUnit: Number((p.stockUnit + deductionBranKg).toFixed(2)),
          };
        }
        return p;
      });

      newMutations.push({
        id: `mut-${Date.now()}-bran`,
        date: createdAt,
        productName: 'Dedak Halus / Katul Super (Eceran / kg)',
        category: 'dedak',
        type: 'masuk',
        quantityKg: deductionBranKg,
        reference: `Jasa Giling #${invoiceNumber}`,
        notes: `Upah potong hasil (bawon dedak) dari ${customerName} (${formatWeight(deductionBranKg)})`,
      });
    }

    if (scheme === 'potong_hasil_beras' && deductionRiceKg > 0) {
      // Find beras eceran product to add stock
      updatedProducts = updatedProducts.map((p) => {
        if (p.category === 'beras' && p.unit === 'kg' && p.name.includes('Ciherang')) {
          return {
            ...p,
            stockUnit: Number((p.stockUnit + deductionRiceKg).toFixed(2)),
          };
        }
        return p;
      });

      newMutations.push({
        id: `mut-${Date.now()}-rice`,
        date: createdAt,
        productName: 'Beras Ciherang Medium (Eceran / kg)',
        category: 'beras',
        type: 'masuk',
        quantityKg: deductionRiceKg,
        reference: `Jasa Giling #${invoiceNumber}`,
        notes: `Upah potong beras dari ${customerName} (${formatWeight(deductionRiceKg)})`,
      });
    }

    // Receivable if upah tunai was kasbon
    let newReceivable: DebtCreditRecord | undefined = undefined;
    if (scheme === 'upah_tunai' && paymentMethod === 'kasbon') {
      newReceivable = {
        id: `dc-${Date.now()}`,
        type: 'piutang_pelanggan',
        contactName: customerName,
        contactPhone: customerPhone,
        referenceInvoice: invoiceNumber,
        description: `Kasbon ongkos jasa giling gabah ${formatWeight(weight)}`,
        initialAmount: cashFeeTotal,
        remainingAmount: cashFeeTotal,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'aktif',
        createdAt,
        payments: [],
      };
    }

    onCompleteMilling(milling, updatedProducts, newMutations, newReceivable);

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setGrainWeightKg(500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cog className="w-5 h-5 text-amber-600" />
            Layanan Jasa Penggilingan Padi
          </h2>
          <p className="text-xs text-slate-500">
            Dua skema fleksibel: Pembayaran Upah Tunai per Kg atau Sistem Potong Hasil (Bawon Dedak / Beras) yang otomatis
            menambah stok kilang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recentMilling.length > 0 && onReprintReceipt && (
            <button
              type="button"
              onClick={() => onReprintReceipt(recentMilling[0])}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 transition-colors shadow-2xs"
              title="Cetak ulang nota giling transaksi terakhir"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>Cetak Ulang Nota Giling</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Rendemen Akurat: Beras ~64%, Dedak ~9%, Menir ~3%</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Customer info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Identitas Pemilik Gabah (Petani)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Petani / Pemilik *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Slamet / Mbah Marjono"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  No. WhatsApp (Untuk Kirim Nota Giling)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234xxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jenis / Varietas Gabah</label>
                <input
                  type="text"
                  value={grainType}
                  onChange={(e) => setGrainType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Berat Gabah Masuk (Kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={grainWeightKg || ''}
                    onChange={(e) => setGrainWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-600" />
                2. Skema Pembayaran Ongkos Giling
              </span>
            </h3>

            {/* Scheme Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setScheme('upah_tunai')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  scheme === 'upah_tunai'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">Upah Tunai</span>
                  <Banknote className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Bayar tunai Rp/kg. Beras & dedak dibawa pulang penuh oleh petani.
                </p>
              </div>

              <div
                onClick={() => setScheme('potong_hasil_dedak')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  scheme === 'potong_hasil_dedak'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">Tukar Dedak (Bawon)</span>
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Bebas ongkos tunai! Seluruh dedak jadi milik kilang sbg upah.
                </p>
              </div>

              <div
                onClick={() => setScheme('potong_hasil_beras')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  scheme === 'potong_hasil_beras'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">Potong Beras</span>
                  <Wheat className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Bebas ongkos tunai. Sebagian beras (5-8%) diserahkan ke kilang.
                </p>
              </div>
            </div>

            {/* Scheme specific parameter */}
            {scheme === 'upah_tunai' && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900">Tarif Upah Giling per Kg:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Rp</span>
                    <input
                      type="number"
                      value={feePerKg || ''}
                      onChange={(e) => setFeePerKg(Number(e.target.value))}
                      className="w-24 text-right px-2 py-1 bg-white border border-amber-300 rounded font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 space-y-2">
                  <label className="font-semibold text-slate-700 block">Metode Pembayaran Upah:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('tunai');
                        setIsQrisConfirmed(false);
                      }}
                      className={`py-2 px-1 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors ${
                        paymentMethod === 'tunai'
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Tunai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`py-2 px-1 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors ${
                        paymentMethod === 'qris'
                          ? 'bg-red-600 border-red-700 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-red-500 group-hover:text-white" />
                      <span>QRIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('transfer');
                        setIsQrisConfirmed(false);
                      }}
                      className={`py-2 px-1 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors ${
                        paymentMethod === 'transfer'
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('kasbon');
                        setIsQrisConfirmed(false);
                      }}
                      className={`py-2 px-1 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors ${
                        paymentMethod === 'kasbon'
                          ? 'bg-red-600 border-red-700 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Kasbon</span>
                    </button>
                  </div>
                </div>

                {/* QRIS Code Payment Display in Milling Tab */}
                {paymentMethod === 'qris' && (
                  <div className="pt-2">
                    <QrisPaymentCard
                      amount={cashFeeTotal}
                      profile={profile}
                      customerName={customerName || 'Petani Giling'}
                      isConfirmed={isQrisConfirmed}
                      onPaymentConfirmed={() => setIsQrisConfirmed(true)}
                    />
                  </div>
                )}

                {/* Transfer Bank Information Box */}
                {paymentMethod === 'transfer' && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-2">
                    <span className="font-bold text-blue-950 block">Rekening Bank Resmi Kilang Padi:</span>
                    <div className="space-y-1 text-slate-700 font-mono text-[11px]">
                      <div className="flex justify-between bg-white p-2 rounded-lg border border-blue-100">
                        <span>BRI: <strong className="text-slate-900">0123-01-004567-53-8</strong></span>
                        <span className="text-slate-500">a.n Bpk. Kamsono</span>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded-lg border border-blue-100">
                        <span>BCA: <strong className="text-slate-900">882-0192-881</strong></span>
                        <span className="text-slate-500">a.n Bpk. Kamsono</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'kasbon' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-red-700 font-semibold">Tgl Jatuh Tempo Kasbon:</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-red-300 rounded text-xs"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {scheme === 'potong_hasil_dedak' && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sistem Tukar Dedak / Bekatul Aktif
                </div>
                <p className="text-[11px] text-emerald-800">
                  Petani tidak dipungut ongkos tunai sama sekali (Rp 0). Seluruh dedak hasil giling (
                  <strong>{formatWeight(estimatedBranKg)}</strong>) akan otomatis dimasukkan ke stok barang gudang kilang!
                </p>
              </div>
            )}

            {scheme === 'potong_hasil_beras' && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2 text-xs text-indigo-900">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Persentase Potongan Beras Upah:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      value={riceDeductionPercent || ''}
                      onChange={(e) => setRiceDeductionPercent(Number(e.target.value))}
                      className="w-16 text-right px-2 py-1 bg-white border border-indigo-300 rounded font-mono font-bold"
                    />
                    <span>%</span>
                  </div>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Kilang mengambil <strong>{formatWeight(deductionRiceKg)}</strong> beras bersih sebagai upah, dan petani
                  membawa pulang <strong>{formatWeight(customerTakeRiceKg)}</strong> beras.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Rendemen Output Preview & Submit */}
        <div className="lg:col-span-5 space-y-5">
          {/* Yield Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Rincian Hasil Giling Padi</span>
              <span className="text-[11px] text-slate-500 font-mono">Gabah: {formatWeight(weight)}</span>
            </h3>

            {/* Total Yield Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div>
                  <span className="font-bold text-emerald-950 block">1. Beras Bersih ({riceYieldPercent}%)</span>
                  <span className="text-[11px] text-emerald-700">
                    Bawa Pulang Petani: <strong className="font-mono">{formatWeight(customerTakeRiceKg)}</strong>
                  </span>
                </div>
                <span className="font-bold font-mono text-emerald-900">{formatWeight(estimatedRiceKg)}</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                <div>
                  <span className="font-bold text-amber-950 block">2. Dedak / Katul Halus ({branYieldPercent}%)</span>
                  <span className="text-[11px] text-amber-700">
                    {scheme === 'potong_hasil_dedak' ? (
                      <span className="text-indigo-800 font-bold">👉 Tinggal di Kilang ({formatWeight(deductionBranKg)})</span>
                    ) : (
                      <span>
                        Bawa Pulang Petani: <strong className="font-mono">{formatWeight(customerTakeBranKg)}</strong>
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-bold font-mono text-amber-900">{formatWeight(estimatedBranKg)}</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800 block">3. Menir Beras ({menirYieldPercent}%)</span>
                  <span className="text-[11px] text-slate-500">
                    Bawa Pulang Petani: <strong className="font-mono">{formatWeight(customerTakeMenirKg)}</strong>
                  </span>
                </div>
                <span className="font-mono text-slate-700">{formatWeight(estimatedMenirKg)}</span>
              </div>
            </div>

            {/* Total Fee Section */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm font-black text-slate-900">
                <span>TOTAL ONGKOS GILING:</span>
                <span className="text-base text-amber-600 font-mono">
                  {scheme === 'upah_tunai' ? formatRupiah(cashFeeTotal) : 'BEBAS ONGKOS TUNAI (POTONG HASIL)'}
                </span>
              </div>

              {scheme === 'upah_tunai' && (
                <div className="flex justify-between text-slate-600">
                  <span>Status Pembayaran:</span>
                  <span
                    className={`font-bold uppercase ${
                      paymentMethod !== 'kasbon' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {paymentMethod !== 'kasbon' ? `Lunas (${paymentMethod.toUpperCase()})` : 'Kasbon / Tempo'}
                  </span>
                </div>
              )}

              {scheme === 'potong_hasil_dedak' && (
                <div className="bg-emerald-100/70 p-2 rounded-lg text-emerald-900 text-[11px] font-medium">
                  ✅ Tambahan Stok Gudang Kilang: <strong>+{formatWeight(deductionBranKg)} Dedak/Katul Super</strong>
                </div>
              )}
            </div>

            {/* Print Confirmation Indicator */}
            <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Cetak Nota Jasa Giling Aktif</span>
                  <span className="text-[10px] text-slate-600 block">
                    Kertas Thermal: {profile.printerPaperWidth || '58mm'} • Rincian Rendemen Petani
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                SIAP CETAK
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesaikan Jasa Giling & Cetak Nota</span>
              <Printer className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
