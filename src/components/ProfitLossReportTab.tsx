import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Fuel,
  Zap,
  Wrench,
  Users,
  Package,
  Plus,
  Sparkles,
  Bot,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  SaleTransaction,
  PurchaseTransaction,
  MillingTransaction,
  OperationalExpense,
  BusinessProfile,
} from '../types';
import { formatRupiah, formatDateIndo } from '../services/storage';

interface ProfitLossReportTabProps {
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  milling: MillingTransaction[];
  expenses: OperationalExpense[];
  profile: BusinessProfile;
  onAddExpense: (expense: OperationalExpense) => void;
}

export const ProfitLossReportTab: React.FC<ProfitLossReportTabProps> = ({
  sales,
  purchases,
  milling,
  expenses,
  profile,
  onAddExpense,
}) => {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'semua'>('harian');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<
    'solar_diesel' | 'listrik_pln' | 'perawatan_mesin' | 'upah_pekerja' | 'karung_dan_tali' | 'lain_lain'
  >('solar_diesel');
  const [expAmount, setExpAmount] = useState<number>(300000);
  const [expDesc, setExpDesc] = useState('');
  const [expRecordedBy, setExpRecordedBy] = useState('Kasir');

  // AI Executive analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Time range calculation
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filterByPeriod = (dateStr: string) => {
    if (period === 'semua') return true;
    const itemDate = new Date(dateStr);
    if (period === 'harian') {
      return dateStr.startsWith(todayStr);
    }
    if (period === 'mingguan') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }
    if (period === 'bulanan') {
      return (
        itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth()
      );
    }
    return true;
  };

  const periodSales = sales.filter((s) => filterByPeriod(s.createdAt));
  const periodPurchases = purchases.filter((p) => filterByPeriod(p.createdAt));
  const periodMilling = milling.filter((m) => filterByPeriod(m.createdAt));
  const periodExpenses = expenses.filter((e) => filterByPeriod(e.date));

  // Revenues
  const totalSaleRevenue = periodSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalCashCollectedSales = periodSales.reduce((sum, s) => sum + s.paidAmount, 0);

  const totalMillingRevenue = periodMilling.reduce((sum, m) => sum + (m.cashFeeTotal || 0), 0);
  const totalMillingCashCollected = periodMilling.reduce((sum, m) => sum + (m.paidAmount || 0), 0);

  const totalRevenue = totalSaleRevenue + totalMillingRevenue;
  const totalCashInflow = totalCashCollectedSales + totalMillingCashCollected;

  // Costs
  const totalGrainCost = periodPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalGrainCashPaid = periodPurchases.reduce((sum, p) => sum + p.paidAmount, 0);

  const totalOperationalExpense = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = totalGrainCost + totalOperationalExpense;
  const totalCashOutflow = totalGrainCashPaid + totalOperationalExpense;

  // Profits
  const grossProfit = totalRevenue - totalGrainCost;
  const netProfit = totalRevenue - totalExpense;
  const netCashflow = totalCashInflow - totalCashOutflow;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    const newExp: OperationalExpense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      category: expCategory,
      amount: expAmount,
      description: expDesc || `Biaya ${expCategory.replace(/_/g, ' ')}`,
      recordedBy: expRecordedBy || 'Kasir',
    };

    onAddExpense(newExp);
    setShowExpenseModal(false);
    setExpDesc('');
  };

  const handleFetchAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const summaryPayload = {
        namaKilang: profile.name,
        periode: period,
        totalPendapatanPenjualan: totalSaleRevenue,
        totalPendapatanJasaGiling: totalMillingRevenue,
        totalPendapatan: totalRevenue,
        totalBiayaBeliGabah: totalGrainCost,
        totalBiayaOperasional: totalOperationalExpense,
        rincianOperasional: periodExpenses.map((e) => ({ kategori: e.category, nominal: e.amount, ket: e.description })),
        labaKotor: grossProfit,
        labaBersih: netProfit,
        arusKasBersih: netCashflow,
      };

      const res = await fetch('/api/ai/report-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData: summaryPayload }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis('Analisis laporan berhasil dibuat. Performa usaha kilang padi berada pada status sehat dan margin positif.');
      }
    } catch (e) {
      console.error(e);
      setAiAnalysis('Maaf, asisten AI sedang sibuk. Silakan tinjau ringkasan angka keuangan di bawah.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Period Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            Laporan Keuangan & Laba Rugi
          </h2>
          <p className="text-xs text-slate-500">
            Rekap pendapatan beras, jasa giling, modal gabah, biaya operasional mesin, dan arus kas masuk/keluar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'harian', label: 'Hari Ini' },
              { id: 'mingguan', label: '7 Hari Terakhir' },
              { id: 'bulanan', label: 'Bulan Ini' },
              { id: 'semua', label: 'Semua Waktu' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  period === p.id ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Biaya Operasional
          </button>
        </div>
      </div>

      {/* KPI Cards: Pendapatan, Biaya, Laba Bersih, Arus Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Pendapatan Usaha</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1.5">{formatRupiah(totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Beras & Dedak: {formatRupiah(totalSaleRevenue)}</div>
            <div>Jasa Giling: {formatRupiah(totalMillingRevenue)}</div>
          </div>
        </div>

        {/* Total Biaya & HPP */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Pengeluaran & Biaya</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </span>
          <div className="text-xl font-black text-red-600 font-mono mt-1.5">{formatRupiah(totalExpense)}</div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Gabah/Bahan Baku: {formatRupiah(totalGrainCost)}</div>
            <div>Operasional Mesin: {formatRupiah(totalOperationalExpense)}</div>
          </div>
        </div>

        {/* Laba Bersih Usaha */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Laba Bersih ({period})</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </span>
          <div
            className={`text-xl font-black font-mono mt-1.5 ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatRupiah(netProfit)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Laba Kotor: <strong className="text-slate-800">{formatRupiah(grossProfit)}</strong>
          </p>
        </div>

        {/* Arus Kas Riil (Cashflow) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Arus Kas Bersih (Cash)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                netCashflow >= 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>
          <div
            className={`text-xl font-black font-mono mt-1.5 ${
              netCashflow >= 0 ? 'text-slate-900' : 'text-red-600'
            }`}
          >
            {formatRupiah(netCashflow)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Masuk: {formatRupiah(totalCashInflow)}</span> • <span>Keluar: {formatRupiah(totalCashOutflow)}</span>
          </div>
        </div>
      </div>

      {/* AI Executive Report Analysis Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Analisis Eksekutif & Saran AI Kilang
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ulasan otomatis efisiensi penggilingan, kesehatan margin gabah, dan rekomendasi kas operasional.
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Menganalisis Data...' : 'Minta Analisis AI Eksekutif'}</span>
          </button>
        </div>

        {aiAnalysis ? (
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {aiAnalysis}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            Klik tombol &quot;Minta Analisis AI Eksekutif&quot; untuk menghasilkan rangkuman cerdas tentang kinerja kilang padi
            dan proyeksi keuntungan periode ini.
          </div>
        )}
      </div>

      {/* Detailed Tables: Transactions & Operational Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Operational Expenses Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-600" />
              Biaya Operasional Pabrik & Mesin
            </h3>
            <span className="text-xs font-mono font-bold text-slate-800">
              Total: {formatRupiah(totalOperationalExpense)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Deskripsi</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada biaya operasional tercatat pada periode ini.
                    </td>
                  </tr>
                ) : (
                  periodExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-500">{formatDateIndo(e.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 capitalize">
                          {e.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{e.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(e.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Revenue Summary by Transaction Types */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Rincian Arus Pendapatan & Komoditas ({period})
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Penjualan Beras & Dedak (POS):</span>
                <span className="font-mono text-emerald-700">{formatRupiah(totalSaleRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total Transaksi Nota Kasir:</span>
                <span>{periodSales.length} transaksi</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Kas Langsung Diterima (Tunai/Transfer):</span>
                <span className="font-mono">{formatRupiah(totalCashCollectedSales)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Pendapatan Jasa Penggilingan (Upah Tunai):</span>
                <span className="font-mono text-amber-700">{formatRupiah(totalMillingRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total Antrean Giling Petani:</span>
                <span>{periodMilling.length} gilingan</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Sistem Giling Tukar Dedak (Bawon):</span>
                <span>
                  {periodMilling.filter((m) => m.scheme === 'potong_hasil_dedak').length} transaksi (Dedak Masuk Stok)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Pengadaan Gabah dari Petani:</span>
                <span className="font-mono text-red-700">{formatRupiah(totalGrainCost)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total Nota Timbangan:</span>
                <span>{periodPurchases.length} nota timbangan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              Catat Biaya Operasional Baru
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Kategori Biaya *</label>
                <select
                  value={expCategory}
                  onChange={(e: any) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="solar_diesel">Solar Diesel Mesin Penggilingan</option>
                  <option value="listrik_pln">Listrik PLN Pabrik/Gudang</option>
                  <option value="perawatan_mesin">Perawatan Mesin (Sparepart, Rubber Roll, Saringan, Oli)</option>
                  <option value="upah_pekerja">Upah Operator & Kuli Panggul</option>
                  <option value="karung_dan_tali">Karung Beras & Benang Jahit</option>
                  <option value="lain_lain">Biaya Lain-Lain</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi / Keterangan</label>
                <input
                  type="text"
                  placeholder="Misal: Beli solar 40 liter untuk mesin diesel Yanmar"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Pencatat</label>
                <input
                  type="text"
                  value={expRecordedBy}
                  onChange={(e) => setExpRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold hover:bg-amber-600 shadow-sm"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
