import React, { useState } from 'react';
import {
  Warehouse,
  Wheat,
  Package,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, GrainStock, StockMutation, ProductCategory } from '../types';
import { formatRupiah, formatWeight, formatDateIndo } from '../services/storage';

interface StockWarehouseTabProps {
  products: Product[];
  grainStock: GrainStock;
  mutations: StockMutation[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateGrainStock: (grain: GrainStock) => void;
  onAddMutation: (mutation: StockMutation) => void;
}

export const StockWarehouseTab: React.FC<StockWarehouseTabProps> = ({
  products,
  grainStock,
  mutations,
  onUpdateProducts,
  onUpdateGrainStock,
  onAddMutation,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'milling_self' | 'mutations'>('inventory');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Self milling form
  const [grainToMillKg, setGrainToMillKg] = useState<number>(1000);
  const [targetRiceProduct, setTargetRiceProduct] = useState<string>(products[0]?.id || '');
  const [targetBranProduct, setTargetBranProduct] = useState<string>('prod-10'); // Dedak eceran
  const [millingNotes, setMillingNotes] = useState('');

  const handleOpenAdjust = (p: Product) => {
    setEditingProduct(p);
    setNewStockVal(p.stockUnit);
    setAdjustReason('Penyesuaian stok opname fisik gudang');
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const diff = newStockVal - editingProduct.stockUnit;
    const updated = products.map((p) =>
      p.id === editingProduct.id ? { ...p, stockUnit: newStockVal } : p
    );

    const mutation: StockMutation = {
      id: `mut-${Date.now()}`,
      date: new Date().toISOString(),
      productName: editingProduct.name,
      category: editingProduct.category,
      type: 'penyesuaian',
      quantityKg: Math.abs(diff * editingProduct.unitWeightKg),
      reference: 'Penyesuaian Manual / Opname',
      notes: `${adjustReason} (${diff >= 0 ? '+' : ''}${diff} ${editingProduct.unit})`,
    };

    onUpdateProducts(updated);
    onAddMutation(mutation);
    setEditingProduct(null);
  };

  // Self milling process: Mill warehouse GKG into rice and bran for sale
  const handleProcessSelfMilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (grainToMillKg <= 0) return;
    if (grainToMillKg > grainStock.gkgKg) {
      alert(`Stok Gabah Kering Giling (GKG) tidak cukup! Tersedia: ${formatWeight(grainStock.gkgKg)}`);
      return;
    }

    const riceYieldKg = Math.round(grainToMillKg * 0.64); // 64% beras
    const branYieldKg = Math.round(grainToMillKg * 0.09); // 9% dedak

    // Deduct GKG stock
    const updatedGrain: GrainStock = {
      ...grainStock,
      gkgKg: grainStock.gkgKg - grainToMillKg,
    };

    // Update target rice and bran products
    const updatedProducts = products.map((p) => {
      if (p.id === targetRiceProduct) {
        const addedUnits = p.unitWeightKg > 1 ? Math.floor(riceYieldKg / p.unitWeightKg) : riceYieldKg;
        return {
          ...p,
          stockUnit: p.stockUnit + addedUnits,
        };
      }
      if (p.id === targetBranProduct) {
        const addedUnits = p.unitWeightKg > 1 ? Math.floor(branYieldKg / p.unitWeightKg) : branYieldKg;
        return {
          ...p,
          stockUnit: p.stockUnit + addedUnits,
        };
      }
      return p;
    });

    const now = new Date().toISOString();
    onUpdateGrainStock(updatedGrain);
    onUpdateProducts(updatedProducts);

    onAddMutation({
      id: `mut-${Date.now()}-self`,
      date: now,
      productName: 'Gabah Kering Giling (GKG)',
      category: 'gabah',
      type: 'keluar',
      quantityKg: grainToMillKg,
      reference: 'Giling Mandiri Stok Gudang',
      notes: `Digiling menjadi ${formatWeight(riceYieldKg)} Beras & ${formatWeight(branYieldKg)} Dedak. ${millingNotes}`,
    });

    alert(
      `Sukses! ${formatWeight(grainToMillKg)} GKG telah digiling menjadi ${formatWeight(
        riceYieldKg
      )} Beras dan ${formatWeight(branYieldKg)} Dedak, stok produk telah diperbarui.`
    );
    setGrainToMillKg(1000);
    setMillingNotes('');
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Quick SubTabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-amber-600" />
            Manajemen Gudang & Stok Terpadu
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring silo gabah, persediaan beras karung & eceran, dedak/katul, serta riwayat mutasi barang (kartu stok).
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Katalog Stok Produk
          </button>
          <button
            onClick={() => setActiveSubTab('milling_self')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              activeSubTab === 'milling_self' ? 'bg-amber-500 text-slate-950 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Giling Mandiri Gudang
          </button>
          <button
            onClick={() => setActiveSubTab('mutations')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'mutations' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Kartu Mutasi Stok
          </button>
        </div>
      </div>

      {/* Silo Gabah Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 rounded-xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-amber-600" />
              Gabah Kering Giling (GKG)
            </span>
            <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Siap Giling
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{formatWeight(grainStock.gkgKg)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Kadar air standar ≤14%, bersih dari kotoran & siap diproses.</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 rounded-xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-emerald-600" />
              Gabah Kering Panen (GKP)
            </span>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Antri Jemur/Silo
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{formatWeight(grainStock.gkpKg)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Kadar air rata-rata 17-19%, perlu pengeringan 1-2 hari.</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-blue-600" />
              Gabah Basah Segar
            </span>
            <span className="bg-blue-200 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Baru Panen
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {formatWeight(grainStock.gabahBasahKg)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kadar air ≥20%, harus segera dijemur/masuk dryer pencegah busuk.</p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Komoditas:</span>
              <div className="flex flex-wrap gap-1 text-xs">
                {['all', 'beras', 'dedak', 'menir', 'sekam'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Semua Komoditas' : cat}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500">{filteredProducts.length} varian produk terdaftar</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Kemasan / Satuan</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Sisa Stok</th>
                  <th className="py-3 px-4">Total Berat (kg)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stockUnit <= p.minStockAlert;
                  const totalKg = p.stockUnit * p.unitWeightKg;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.category === 'beras'
                              ? 'bg-amber-100 text-amber-800'
                              : p.category === 'dedak'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.unit}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatRupiah(p.pricePerUnit)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isLow ? 'bg-red-100 text-red-700' : 'text-slate-800'
                          }`}
                        >
                          {p.stockUnit} {p.unit === 'kg' ? 'kg' : 'karung'}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-red-600 font-semibold mt-0.5">
                            ⚠️ Stok Menipis (Min: {p.minStockAlert})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{formatWeight(totalKg)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Self Milling (Giling Gabah Sendiri) */}
      {activeSubTab === 'milling_self' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              Proses Giling Gabah Sendiri (GKG Silo ke Stok Toko)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Giling gabah kering giling (GKG) milik sendiri untuk memproduksi Beras dan Dedak yang siap dipajang di
              etalase kasir.
            </p>
          </div>

          <form onSubmit={handleProcessSelfMilling} className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>Gabah Kering Giling (GKG) Tersedia di Gudang:</span>
              <strong className="text-sm font-mono text-amber-950">{formatWeight(grainStock.gkgKg)}</strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jumlah GKG yang Mau Digiling (Kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max={grainStock.gkgKg}
                    value={grainToMillKg || ''}
                    onChange={(e) => setGrainToMillKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Produk Beras Tujuan Masuk Stok *</label>
                <select
                  value={targetRiceProduct}
                  onChange={(e) => setTargetRiceProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {products
                    .filter((p) => p.category === 'beras')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800">Proyeksi Hasil Giling Otomatis (Rendemen 64% & 9%):</span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Beras Siap Jual:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    +{formatWeight(Math.round(grainToMillKg * 0.64))}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Dedak Halus / Katul:</span>
                  <span className="text-base font-bold text-amber-700 font-mono">
                    +{formatWeight(Math.round(grainToMillKg * 0.09))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Operasional / Operator</label>
              <input
                type="text"
                placeholder="Contoh: Mesin diesel shift pagi oleh Mas Joko & Anto"
                value={millingNotes}
                onChange={(e) => setMillingNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={grainToMillKg <= 0 || grainToMillKg > grainStock.gkgKg}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              Proses Giling Sekarang & Tambah ke Stok Toko
            </button>
          </form>
        </div>
      )}

      {/* SubTab 3: Stock Mutation Log (Kartu Stok) */}
      {activeSubTab === 'mutations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Riwayat Mutasi & Kartu Stok Terperinci
            </h3>
            <span className="text-xs text-slate-500">{mutations.length} catatan pergerakan barang</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Tanggal & Waktu</th>
                  <th className="py-2.5 px-4">Nama Barang</th>
                  <th className="py-2.5 px-4">Jenis Mutasi</th>
                  <th className="py-2.5 px-4">Jumlah (Kg)</th>
                  <th className="py-2.5 px-4">Referensi Transaksi</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-slate-500">{formatDateIndo(m.date)}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{m.productName}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                          m.type === 'masuk'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'keluar'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.type === 'masuk' ? (
                          <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                        ) : m.type === 'keluar' ? (
                          <ArrowUpRight className="w-3 h-3 text-red-600" />
                        ) : null}
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{formatWeight(m.quantityKg)}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{m.reference}</td>
                    <td className="py-2.5 px-4 text-slate-500">{m.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Penyesuaian Stok Fisik: {editingProduct.name}
            </h3>

            <form onSubmit={handleSaveAdjust} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Stok Tercatat di Sistem:</label>
                <div className="font-mono font-bold text-sm text-slate-900">
                  {editingProduct.stockUnit} {editingProduct.unit}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Stok Nyata Hasil Opname Fisik *</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alasan Penyesuaian *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Misal: Selisih timbangan susut, karung sobek, opname bulanan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
