import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  History,
  Share2,
} from 'lucide-react';
import { DebtCreditRecord, BusinessProfile } from '../types';
import { formatRupiah, formatDateIndo } from '../services/storage';

interface DebtCreditTabProps {
  records: DebtCreditRecord[];
  profile: BusinessProfile;
  onUpdateRecords: (records: DebtCreditRecord[]) => void;
  onRecordPaymentCashflow: (type: 'masuk' | 'keluar', amount: number, desc: string) => void;
}

export const DebtCreditTab: React.FC<DebtCreditTabProps> = ({
  records,
  profile,
  onUpdateRecords,
  onRecordPaymentCashflow,
}) => {
  const [activeType, setActiveType] = useState<'piutang_pelanggan' | 'utang_ke_petani'>('piutang_pelanggan');
  const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'jatuh_tempo' | 'lunas'>('all');
  const [selectedRecordForPayment, setSelectedRecordForPayment] = useState<DebtCreditRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>('');

  const today = new Date().toISOString().slice(0, 10);

  // Compute metrics
  const totalReceivable = records
    .filter((r) => r.type === 'piutang_pelanggan' && r.status !== 'lunas')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const totalDebt = records
    .filter((r) => r.type === 'utang_ke_petani' && r.status !== 'lunas')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const overdueCount = records.filter(
    (r) => r.status === 'aktif' && r.dueDate && r.dueDate < today
  ).length;

  const filteredRecords = records.filter((r) => {
    if (r.type !== activeType) return false;
    const isOverdue = r.status === 'aktif' && r.dueDate && r.dueDate < today;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'jatuh_tempo') return isOverdue;
    if (filterStatus === 'aktif') return r.status === 'aktif' && !isOverdue;
    if (filterStatus === 'lunas') return r.status === 'lunas';
    return true;
  });

  const handleOpenPayment = (record: DebtCreditRecord) => {
    setSelectedRecordForPayment(record);
    setPaymentAmount(record.remainingAmount);
    setPaymentNote('Pembayaran cicilan / pelunasan tunai');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForPayment || paymentAmount <= 0) return;

    const newRemaining = Math.max(0, selectedRecordForPayment.remainingAmount - paymentAmount);
    const newStatus: 'aktif' | 'lunas' = newRemaining === 0 ? 'lunas' : 'aktif';

    const newPaymentEntry = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
      amount: paymentAmount,
      notes: paymentNote,
    };

    const updated = records.map((r) => {
      if (r.id === selectedRecordForPayment.id) {
        return {
          ...r,
          remainingAmount: newRemaining,
          status: newStatus,
          payments: [newPaymentEntry, ...r.payments],
        };
      }
      return r;
    });

    onUpdateRecords(updated);

    // Cashflow notification
    if (selectedRecordForPayment.type === 'piutang_pelanggan') {
      onRecordPaymentCashflow(
        'masuk',
        paymentAmount,
        `Pelunasan piutang/kasbon dari ${selectedRecordForPayment.contactName} (${selectedRecordForPayment.referenceInvoice})`
      );
    } else {
      onRecordPaymentCashflow(
        'keluar',
        paymentAmount,
        `Pembayaran utang usaha gabah ke ${selectedRecordForPayment.contactName} (${selectedRecordForPayment.referenceInvoice})`
      );
    }

    setSelectedRecordForPayment(null);
  };

  const handleSendReminderWA = (record: DebtCreditRecord) => {
    const isReceivable = record.type === 'piutang_pelanggan';
    const message = isReceivable
      ? `🌾 *PENGINGAT KASBON / TEMPO USAHA*
*${profile.name.toUpperCase()}*
Halo Bapak/Ibu *${record.contactName}*,
Semoga usaha dan aktivitas panen senantiasa lancar berkah.

Kami menginformasikan catatan kasbon/tempo:
- No. Referensi : ${record.referenceInvoice}
- Keterangan    : ${record.description}
- Sisa Tagihan  : *${formatRupiah(record.remainingAmount)}*
- Jatuh Tempo   : *${record.dueDate || '-'}*

Pembayaran dapat dititipkan saat kirim gabah/beras atau transfer. Terima kasih banyak atas kerja sama yang baik. 🙏`
      : `🌾 *KONFIRMASI RENCANA PELUNASAN GABAH*
*${profile.name.toUpperCase()}*
Kepada Yth. Bapak/Ibu *${record.contactName}*,
Kami mengkonfirmasi sisa pembayaran gabah #${record.referenceInvoice} sebesar *${formatRupiah(
          record.remainingAmount
        )}* dengan target jatuh tempo ${record.dueDate}. Pembayaran sedang dipersiapkan oleh bagian kasir. Terima kasih. 🙏`;

    let phone = (record.contactPhone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Piutang Pelanggan (Kasbon):</span>
            <div className="text-xl font-black text-amber-600 font-mono mt-1">{formatRupiah(totalReceivable)}</div>
            <span className="text-[11px] text-slate-400">Hak tagih penjualan beras & jasa giling</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Utang Usaha ke Petani:</span>
            <div className="text-xl font-black text-red-600 font-mono mt-1">{formatRupiah(totalDebt)}</div>
            <span className="text-[11px] text-slate-400">Kewajiban pelunasan pembelian gabah</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tagihan Lewat Jatuh Tempo:</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{overdueCount} Rekening</div>
            <span className="text-[11px] text-red-600 font-medium">Perlu dikirimkan pesan pengingat WA</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Sub-navigation & Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveType('piutang_pelanggan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === 'piutang_pelanggan'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Piutang (Kasbon Pelanggan)
            </button>
            <button
              onClick={() => setActiveType('utang_ke_petani')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === 'utang_ke_petani'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Utang Usaha ke Petani
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            {(['all', 'aktif', 'jatuh_tempo', 'lunas'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all'
                  ? 'Semua'
                  : st === 'jatuh_tempo'
                  ? '⚠️ Lewat Tempo'
                  : st === 'aktif'
                  ? 'Aktif'
                  : 'Lunas'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Nama Mitra / Petani</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Awal</th>
                <th className="py-3 px-4">Sisa Tagihan</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data hutang/piutang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isOverdue = r.status === 'aktif' && r.dueDate && r.dueDate < today;
                  const isDueSoon = r.status === 'aktif' && r.dueDate && r.dueDate === today;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{r.contactName}</div>
                        {r.contactPhone && (
                          <div className="text-[10px] text-slate-500 font-mono">{r.contactPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{r.referenceInvoice}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.description}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatRupiah(r.initialAmount)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(r.remainingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700">{r.dueDate || '-'}</div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 block mt-0.5">Lewat Tempo!</span>
                        )}
                        {isDueSoon && (
                          <span className="text-[10px] font-bold text-amber-600 block mt-0.5">Jatuh Tempo Hari Ini</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'lunas' ? 'Lunas' : isOverdue ? 'Jatuh Tempo' : 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {r.status !== 'lunas' && (
                          <button
                            onClick={() => handleOpenPayment(r)}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            Bayar Cicilan
                          </button>
                        )}

                        <button
                          onClick={() => handleSendReminderWA(r)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Kirim Pengingat WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 inline text-emerald-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Installment Modal */}
      {selectedRecordForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Pencatatan Cicilan / Pelunasan
            </h3>

            <div className="py-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
              <div className="flex justify-between">
                <span>Mitra:</span>
                <span className="font-bold text-slate-900">{selectedRecordForPayment.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span>Referensi Transaksi:</span>
                <span className="font-mono text-slate-800">{selectedRecordForPayment.referenceInvoice}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Sisa Tagihan Saat Ini:</span>
                <span className="font-mono text-sm text-amber-700">
                  {formatRupiah(selectedRecordForPayment.remainingAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nominal Pembayaran Sekarang (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRecordForPayment.remainingAmount}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                  required
                />
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedRecordForPayment.remainingAmount)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                  >
                    Bayar Lunas Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(selectedRecordForPayment.remainingAmount / 2))}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Bayar 50%
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Pembayaran / Kasir</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Misal: Diterima tunai di meja kasir oleh H. Sutrisno"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForPayment(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Setujui & Simpan Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
