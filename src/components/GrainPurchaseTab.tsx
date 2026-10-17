import React, { useState, useId } from 'react';
import {
  Scale,
  Wheat,
  User,
  Phone,
  Droplets,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Calendar,
  Layers,
  Printer,
  History,
} from 'lucide-react';
import {
  PurchaseTransaction,
  GrainStock,
  Product,
  DebtCreditRecord,
  StockMutation,
  BusinessProfile,
  RafaksiDetail,
} from '../types';
import {
  calculateRafaksi,
  formatRupiah,
  formatWeight,
  formatDateIndo,
} from '../services/storage';

interface GrainPurchaseTabProps {
  profile: BusinessProfile;
  grainStock: GrainStock;
  products: Product[];
  recentPurchases?: PurchaseTransaction[];
  onCompletePurchase: (
    purchase: PurchaseTransaction,
    updatedGrainStock: GrainStock,
    newDebt?: DebtCreditRecord,
    newMutation?: StockMutation
  ) => void;
  onReprintReceipt?: (purchase: PurchaseTransaction) => void;
}

export const GrainPurchaseTab: React.FC<GrainPurchaseTabProps> = ({
  profile,
  grainStock,
  products,
  recentPurchases = [],
  onCompletePurchase,
  onReprintReceipt,
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [itemType, setItemType] = useState<
    'gabah_kering_panen' | 'gabah_kering_giling' | 'gabah_basah' | 'beras_petani'
  >('gabah_kering_panen');
  const [itemName, setItemName] = useState('Gabah Kering Panen (GKP) Varietas Ciherang');

  // Weighing & Rafaksi Form
  const [grossWeightKg, setGrossWeightKg] = useState<number>(2500);
  const [bagCount, setBagCount] = useState<number>(50);
  const [tarePerBagKg, setTarePerBagKg] = useState<number>(0.6);
  const [moisturePercent, setMoisturePercent] = useState<number>(18.0);
  const [impurityPercent, setImpurityPercent] = useState<number>(1.0);
  const [pricePerKg, setPricePerKg] = useState<number>(7200);

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer' | 'utang_usaha'>('tunai');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Live calculation of rafaksi
  const rafaksi: RafaksiDetail = calculateRafaksi(
    grossWeightKg || 0,
    bagCount || 0,
    tarePerBagKg || 0,
    moisturePercent || 0,
    profile.standardMoisture || 14.0,
    impurityPercent || 0
  );

  const totalAmount = Math.round(rafaksi.netWeightKg * (pricePerKg || 0));
  const remainingDebt = paymentMethod === 'utang_usaha' ? Math.max(0, totalAmount - (paidAmount || 0)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Nama petani/pemasok wajib diisi!');
      return;
    }
    if (grossWeightKg <= 0) {
      alert('Berat timbangan kotor harus lebih dari 0!');
      return;
    }
    if (pricePerKg <= 0) {
      alert('Harga per kg harus lebih dari 0!');
      return;
    }
    if (paymentMethod === 'utang_usaha' && !dueDate) {
      alert('Untuk utang usaha/tempo, tanggal jatuh tempo wajib diisi!');
      return;
    }

    const invoiceNumber = `PB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const createdAt = new Date().toISOString();

    const actualPaid = paymentMethod === 'utang_usaha' ? paidAmount : totalAmount;

    const purchase: PurchaseTransaction = {
      id: `pur-${Date.now()}`,
      invoiceNumber,
      createdAt,
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
      itemType,
      itemName,
      rafaksi,
      pricePerKg,
      totalAmount,
      paymentMethod,
      paidAmount: actualPaid,
      remainingDebt,
      dueDate: paymentMethod === 'utang_usaha' ? dueDate : undefined,
      status: paymentMethod === 'utang_usaha' && remainingDebt > 0 ? 'belum_lunas' : 'lunas',
      notes,
    };

    // Update Grain Stock in warehouse
    const updatedGrainStock: GrainStock = { ...grainStock };
    if (itemType === 'gabah_kering_panen') {
      updatedGrainStock.gkpKg += rafaksi.netWeightKg;
    } else if (itemType === 'gabah_kering_giling') {
      updatedGrainStock.gkgKg += rafaksi.netWeightKg;
    } else if (itemType === 'gabah_basah') {
      updatedGrainStock.gabahBasahKg += rafaksi.netWeightKg;
    }

    // Debt record if tempo
    let newDebt: DebtCreditRecord | undefined = undefined;
    if (paymentMethod === 'utang_usaha' && remainingDebt > 0) {
      newDebt = {
        id: `dc-${Date.now()}`,
        type: 'utang_ke_petani',
        contactName: supplierName,
        contactPhone: supplierPhone,
        referenceInvoice: invoiceNumber,
        description: `Utang pembelian ${itemName} (${formatWeight(rafaksi.netWeightKg)})`,
        initialAmount: remainingDebt,
        remainingAmount: remainingDebt,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'aktif',
        createdAt,
        payments: [],
      };
    }

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      date: createdAt,
      productName: itemName,
      category: 'gabah',
      type: 'masuk',
      quantityKg: rafaksi.netWeightKg,
      reference: `Beli Gabah #${invoiceNumber}`,
      notes: `Dari ${supplierName} (Netto: ${formatWeight(rafaksi.netWeightKg)}, Bruto: ${formatWeight(
        grossWeightKg
      )})`,
    };

    onCompletePurchase(purchase, updatedGrainStock, newDebt, newMutation);

    // Reset Form
    setSupplierName('');
    setSupplierPhone('');
    setNotes('');
    setGrossWeightKg(2500);
    setBagCount(50);
    setPaidAmount(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Quick Grain Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            Timbangan & Pembelian Gabah Petani
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan pembelian gabah panen, basah, maupun kering giling dengan kalkulator potongan timbangan (rafaksi)
            otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {recentPurchases.length > 0 && onReprintReceipt && (
            <button
              type="button"
              onClick={() => onReprintReceipt(recentPurchases[0])}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 transition-colors shadow-2xs"
              title="Cetak ulang nota timbang gabah transaksi terakhir"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>Cetak Ulang Nota Timbang</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg text-xs">
            <div>
              <span className="text-amber-800 font-medium">Stok Gabah Gudang:</span>
              <div className="flex gap-3 font-semibold text-slate-800 mt-0.5">
                <span>GKG: {formatWeight(grainStock.gkgKg)}</span>
                <span>•</span>
                <span>GKP: {formatWeight(grainStock.gkpKg)}</span>
                <span>•</span>
                <span>Basah: {formatWeight(grainStock.gabahBasahKg)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Supplier & Grain Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Supplier Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Identitas Petani / Pemasok
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Petani / Pengepul *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Tarjo / Kelompok Tani Makmur"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  No. WhatsApp Petani (Untuk Nota)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Gabah *</label>
                <select
                  value={itemType}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setItemType(val);
                    if (val === 'gabah_kering_panen') {
                      setItemName('Gabah Kering Panen (GKP) Varietas Ciherang');
                      setMoisturePercent(18.0);
                      setPricePerKg(7200);
                    } else if (val === 'gabah_kering_giling') {
                      setItemName('Gabah Kering Giling (GKG) Siap Giling');
                      setMoisturePercent(14.0);
                      setPricePerKg(8000);
                    } else if (val === 'gabah_basah') {
                      setItemName('Gabah Basah Panen Segar Sawah');
                      setMoisturePercent(23.0);
                      setPricePerKg(6300);
                    } else {
                      setItemName('Beras Asalan Petani / Pecah Kulit');
                      setMoisturePercent(14.0);
                      setPricePerKg(12000);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="gabah_kering_panen">Gabah Kering Panen (GKP)</option>
                  <option value="gabah_kering_giling">Gabah Kering Giling (GKG - Siap Giling)</option>
                  <option value="gabah_basah">Gabah Basah (Segar / Kadar Air Tinggi)</option>
                  <option value="beras_petani">Beras Petani / Pecah Kulit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Spesifik / Varietas</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Weighing & Rafaksi Parameters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                2. Data Timbangan & Uji Mutu Rafaksi
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Standar SNI GKG: {profile.standardMoisture}% Kadar Air
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Berat Bruto (Kotor) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={grossWeightKg || ''}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jumlah Karung *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={bagCount || ''}
                    onChange={(e) => setBagCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">krg</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tara per Karung</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={tarePerBagKg || ''}
                    onChange={(e) => setTarePerBagKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  Kadar Air (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="35"
                    value={moisturePercent || ''}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  Hampa & Kotoran (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={impurityPercent || ''}
                    onChange={(e) => setImpurityPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Harga Beli per Kg *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    value={pricePerKg || ''}
                    onChange={(e) => setPricePerKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Rp</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Gabah kering sawah Pak Tarjo, bersih tidak ada batu"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Rafaksi Breakdown & Payment */}
        <div className="lg:col-span-5 space-y-5">
          {/* Visual Rafaksi Breakdown Card */}
          <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-amber-950 pb-2 border-b border-amber-200 flex items-center justify-between">
              <span>Hasil Perhitungan Rafaksi</span>
              <span className="text-xs font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Potongan Total: {rafaksi.totalRafaksiPercent}%
              </span>
            </h3>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Berat Bruto:</span>
                <span className="font-mono font-semibold">{formatWeight(rafaksi.grossWeightKg)}</span>
              </div>

              <div className="flex justify-between text-red-600">
                <span>Potongan Karung ({rafaksi.bagCount} x {rafaksi.tarePerBagKg} kg):</span>
                <span className="font-mono">-{formatWeight(rafaksi.totalTareKg)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Berat Setelah Tara:</span>
                <span className="font-mono font-semibold">
                  {formatWeight(Math.max(0, rafaksi.grossWeightKg - rafaksi.totalTareKg))}
                </span>
              </div>

              <div className="flex justify-between text-red-600">
                <span>Potongan Kadar Air ({rafaksi.moisturePercent}% - {profile.standardMoisture}%):</span>
                <span className="font-mono">-{rafaksi.moistureRafaksiPercent}%</span>
              </div>

              <div className="flex justify-between text-red-600">
                <span>Potongan Hampa / Kotoran:</span>
                <span className="font-mono">-{rafaksi.impurityPercent}%</span>
              </div>

              <div className="flex justify-between text-red-700 font-medium pt-1 border-t border-amber-200">
                <span>Total Potongan Rafaksi:</span>
                <span className="font-mono font-bold">-{formatWeight(rafaksi.totalRafaksiKg)}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 bg-white p-2.5 rounded-lg border border-amber-300">
                <span className="text-emerald-800">BERAT BERSIH (NETTO):</span>
                <span className="text-base text-emerald-700 font-mono">{formatWeight(rafaksi.netWeightKg)}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>TOTAL HARGA GABAH:</span>
                <span className="text-lg text-amber-600 font-mono">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              3. Penentuan Status Pembayaran
            </h3>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('tunai');
                  setPaidAmount(totalAmount);
                }}
                className={`py-2 px-2 rounded-lg font-bold border transition-colors ${
                  paymentMethod === 'tunai'
                    ? 'bg-amber-500 border-amber-600 text-slate-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Tunai Lunas
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transfer');
                  setPaidAmount(totalAmount);
                }}
                className={`py-2 px-2 rounded-lg font-bold border transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'bg-amber-500 border-amber-600 text-slate-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Transfer Bank
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('utang_usaha');
                  setPaidAmount(0);
                }}
                className={`py-2 px-2 rounded-lg font-bold border transition-colors ${
                  paymentMethod === 'utang_usaha'
                    ? 'bg-red-500 border-red-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Utang (Tempo)
              </button>
            </div>

            {paymentMethod === 'utang_usaha' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-medium">Uang Muka / Dibayar Sekarang:</span>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-32 text-right px-2 py-1 bg-white border border-red-300 rounded font-mono text-xs"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-semibold">Tgl Jatuh Tempo Pelunasan *:</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-red-300 rounded text-xs"
                    required
                  />
                </div>

                <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-red-200">
                  <span>Sisa Utang Usaha ke Petani:</span>
                  <span className="font-mono text-sm">{formatRupiah(remainingDebt)}</span>
                </div>
              </div>
            )}

            {/* Print Confirmation Indicator */}
            <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Cetak Nota Timbang Gabah Aktif</span>
                  <span className="text-[10px] text-slate-600 block">
                    Kertas Thermal: {profile.printerPaperWidth || '58mm'} • Surat Jalan Petani
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
              <span>Setujui Pembelian & Cetak Nota Timbang</span>
              <Printer className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
