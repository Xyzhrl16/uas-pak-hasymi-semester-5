import React, { useState } from 'react';
import { Building2, X, Check, Save, QrCode, Printer } from 'lucide-react';
import { BusinessProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  profile: BusinessProfile;
  onSave: (updated: BusinessProfile) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Pengaturan Profil Penggilingan Padi</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nama Usaha Kilang Padi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Slogan / Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">No. Telp / WhatsApp *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Pemilik / Pengelola</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Alamat Pabrik / Gudang</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tarif Standar Upah Giling (Rp/Kg)</label>
              <input
                type="number"
                value={formData.cashFeeRatePerKg}
                onChange={(e) => setFormData({ ...formData, cashFeeRatePerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standar Kadar Air SNI (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.standardMoisture}
                onChange={(e) => setFormData({ ...formData, standardMoisture: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          {/* Konfigurasi Kode QRIS */}
          <div className="p-3 bg-red-50/70 rounded-xl border border-red-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-red-950 text-xs">
              <QrCode className="w-4 h-4 text-red-600" />
              <span>Konfigurasi Kode QRIS Pembayaran Digital</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kode QRIS akan otomatis digenerate secara standar nasional (EMVCo) sesuai transaksi kasir.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Merchant QRIS</label>
                <input
                  type="text"
                  value={formData.qrisMerchantName || ''}
                  placeholder="SUMBER MAKMUR RICE MILL"
                  onChange={(e) => setFormData({ ...formData, qrisMerchantName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor NMID Nasional</label>
                <input
                  type="text"
                  value={formData.qrisNmid || ''}
                  placeholder="ID1024356789123"
                  onChange={(e) => setFormData({ ...formData, qrisNmid: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Konfigurasi Mesin Cetak Struk Thermal */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                <Printer className="w-4 h-4" />
                <span>Pengaturan Cetak Struk (Thermal Printer)</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                POS & Mobile
              </span>
            </div>

            {/* Auto Print Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={formData.autoPrintReceipt ?? true}
                onChange={(e) => setFormData({ ...formData, autoPrintReceipt: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-white text-xs block">Aktifkan Cetak Struk Otomatis</span>
                <span className="text-[11px] text-slate-400 block">
                  Dialog cetak langsung aktif saat kasir/operator menyetujui transaksi
                </span>
              </div>
            </label>

            {/* Paper Width & Copies */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Ukuran Kertas Thermal:
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printerPaperWidth: '58mm' })}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition-all ${
                      (formData.printerPaperWidth || '58mm') === '58mm'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    58 mm (Mini/BT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printerPaperWidth: '80mm' })}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition-all ${
                      formData.printerPaperWidth === '80mm'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    80 mm (POS)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Jumlah Lembar Nota:
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printCopies: 1 })}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition-all ${
                      (formData.printCopies || 1) === 1
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    1 Lembar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, printCopies: 2 })}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition-all ${
                      formData.printCopies === 2
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    2 Rangkap
                  </button>
                </div>
              </div>
            </div>

            {/* Show QRIS verification on receipt */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={formData.showQrisOnReceipt !== false}
                onChange={(e) => setFormData({ ...formData, showQrisOnReceipt: e.target.checked })}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Cetak barcode verifikasi QRIS di struk jika dibayar via QRIS</span>
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Pesan Kaki Struk (Nota Footer)</label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
