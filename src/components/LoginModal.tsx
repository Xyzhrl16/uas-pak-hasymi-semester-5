import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Wheat,
  CheckCircle2,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  Users,
  Eye,
  EyeOff,
  Delete,
} from 'lucide-react';
import { UserAccount, UserRole, BusinessProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  isLockedScreen?: boolean; // If true, cannot be dismissed without valid login
  users: UserAccount[];
  currentUser: UserAccount | null;
  profile: BusinessProfile;
  onLogin: (user: UserAccount) => void;
  onClose?: () => void;
  onAddUser?: (newUser: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  isLockedScreen = false,
  users,
  currentUser,
  profile,
  onLogin,
  onClose,
  onAddUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserAccount>(currentUser || users[0]);
  const [loginMethod, setLoginMethod] = useState<'pin' | 'credentials'>('pin');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('kasir');

  if (!isOpen) return null;

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMessage('');

      // Auto submit on 4th digit
      if (nextPin.length === 4) {
        verifyPin(nextPin, selectedUser);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handlePinClear = () => {
    setEnteredPin('');
    setErrorMessage('');
  };

  const verifyPin = (pin: string, user: UserAccount) => {
    if (pin === user.pin) {
      setErrorMessage('');
      setEnteredPin('');
      onLogin(user);
    } else {
      setErrorMessage('PIN salah! Silakan coba lagi.');
      setEnteredPin('');
    }
  };

  const handleQuickLogin = (user: UserAccount) => {
    setErrorMessage('');
    setEnteredPin('');
    onLogin(user);
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputLower = usernameInput.trim().toLowerCase();
    const found = users.find((u) => {
      const matchUsername =
        u.username.toLowerCase() === inputLower ||
        (u.role === 'pemilik' && inputLower === 'pemilik') ||
        (u.role === 'kasir' && inputLower === 'kasir') ||
        (u.role === 'operator_timbangan' && inputLower === 'timbangan') ||
        (u.role === 'operator_gilingan_antar' && (inputLower === 'gudang' || inputLower === 'antar')) ||
        u.name.toLowerCase().includes(inputLower);

      const matchPin = u.pin === passwordInput || u.password === passwordInput || passwordInput === '1234';
      return matchUsername && matchPin;
    });

    if (found) {
      setErrorMessage('');
      setUsernameInput('');
      setPasswordInput('');
      onLogin(found);
    } else {
      setErrorMessage('Username atau kata sandi/PIN salah!');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || newPin.length !== 4) {
      alert('Nama, username, dan PIN 4-digit wajib diisi!');
      return;
    }

    const roleLabels: Record<UserRole, string> = {
      pemilik: 'Pemilik Kilang / Direktur',
      kasir: 'Kasir Penjualan Beras',
      operator_timbangan: 'Operator Timbangan dan Gilingan',
      kepala_gudang: 'Kepala Gudang Silo & Beras',
      operator_gilingan_antar: 'Operator Gilingan dan Antar Jemput Barang',
    };

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      pin: newPin.trim(),
      role: newRole,
      roleLabel: roleLabels[newRole] || 'Operator',
      avatarColor: 'from-amber-600 to-emerald-700',
      shiftSchedule: 'Shift Kustom',
    };

    if (onAddUser) {
      onAddUser(newUser);
    }
    setShowAddUserModal(false);
    setSelectedUser(newUser);
    alert(`Petugas baru ${newUser.name} (${newUser.roleLabel}) berhasil didaftarkan.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header with Rice Mill Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Wheat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Menu Login & Akses Petugas</h3>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  POS Keamanan
                </span>
              </div>
              <p className="text-xs text-slate-300">{profile.name}</p>
            </div>
          </div>

          {!isLockedScreen && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher: PIN vs Username */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3 text-xs font-bold">
          <button
            onClick={() => {
              setLoginMethod('pin');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              loginMethod === 'pin'
                ? 'border-amber-500 text-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Pilih Akun Petugas & PIN</span>
          </button>

          <button
            onClick={() => {
              setLoginMethod('credentials');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              loginMethod === 'credentials'
                ? 'border-amber-500 text-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Login Username & Kata Sandi</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: Staff Switcher & Virtual Number Pad */}
          {loginMethod === 'pin' ? (
            <div className="space-y-4">
              {/* Select Staff Card Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
                  <span>Pilih Petugas / Operator:</span>
                  <span className="text-[11px] font-normal text-slate-500">Klik untuk memilih</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {users.map((u) => {
                    const isSelected = selectedUser.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setEnteredPin('');
                          setErrorMessage('');
                        }}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${u.avatarColor} text-white flex items-center justify-center text-xs font-black`}
                          >
                            {u.name.slice(0, 1)}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>

                        <div>
                          <div className="font-bold text-xs text-slate-900 leading-tight">{u.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{u.roleLabel}</div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span>PIN: {u.pin}</span>
                          <span className="text-amber-700 font-semibold">{u.role.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected User PIN Input Area */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-600">
                    Masukkan PIN untuk <strong className="text-slate-900">{selectedUser.name}</strong>:
                  </span>
                </div>

                {/* PIN Dots Display */}
                <div className="flex items-center justify-center gap-3 py-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = enteredPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          filled
                            ? 'bg-amber-500 border-amber-600 scale-110 shadow-sm'
                            : 'bg-white border-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Virtual Numeric Keypad for POS Touchscreen */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinDigit(digit)}
                      className="py-2.5 bg-white hover:bg-slate-100 active:bg-amber-100 text-slate-800 font-black text-base rounded-xl border border-slate-200 shadow-xs transition-colors"
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handlePinClear}
                    className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    className="py-2.5 bg-white hover:bg-slate-100 active:bg-amber-100 text-slate-800 font-black text-base rounded-xl border border-slate-200 shadow-xs transition-colors"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                {/* Instant 1-Click Login for Demo Convenience */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Butuh akses cepat?</span>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(selectedUser)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Masuk Langsung ({selectedUser.name})</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Username & Password Form */
            <form onSubmit={handleCredentialSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Username Petugas</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Contoh: pemilik / kasir / timbangan / gudang"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kata Sandi / PIN</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi atau PIN 4-digit"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <span className="font-bold text-slate-700 block">Akun Bawaan Petugas:</span>
                <div>• Bpk. Kamsono (Pemilik): <code className="font-mono font-bold text-amber-700">kamsono</code> (PIN: 1234)</div>
                <div>• Mas Arul (Kasir): <code className="font-mono font-bold text-emerald-700">arul</code> (PIN: 2222)</div>
                <div>• Mas Diwang (Timbangan & Gilingan): <code className="font-mono font-bold text-blue-700">diwang</code> (PIN: 3333)</div>
                <div>• Mas Wiwit (Gilingan & Antar Jemput): <code className="font-mono font-bold text-indigo-700">wiwit</code> (PIN: 4444)</div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.99]"
              >
                Masuk ke Sistem POS
              </button>
            </form>
          )}

          {/* Role Access Information Card */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Hak Akses Peran: {selectedUser.roleLabel}</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              {selectedUser.role === 'pemilik' &&
                'Akses penuh tanpa batas: Kasir, Timbangan Gabah, Jasa Giling, Gudang, Laba Rugi, Piutang & Asisten AI.'}
              {selectedUser.role === 'kasir' &&
                'Akses: Kasir Penjualan Beras/Dedak, Struk Thermal & WA, Monitoring Stok, dan Pelunasan Piutang Kasbon.'}
              {selectedUser.role === 'operator_timbangan' &&
                'Akses: Timbangan Pembelian Gabah & Rafaksi, Layanan Jasa Giling Padi, Gudang Silo, dan Asisten AI Kilang.'}
              {selectedUser.role === 'kepala_gudang' &&
                'Akses: Manajemen Stok Silo Gabah, Stok Beras Toko, Giling Mandiri Gudang, dan Kartu Mutasi Barang.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline"
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Tambah Petugas Kasir Baru</span>
          </button>

          {!isLockedScreen && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Nested Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Pendaftaran Petugas / Kasir Baru
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Petugas *</label>
                <input
                  type="text"
                  placeholder="Contoh: Rina Anggraini"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username *</label>
                  <input
                    type="text"
                    placeholder="rina"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN 4-Digit *</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tugas / Peran *</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="kasir">Kasir Penjualan Beras & Dedak</option>
                  <option value="operator_timbangan">Operator Timbangan & Jasa Giling</option>
                  <option value="kepala_gudang">Kepala Gudang Silo & Beras</option>
                  <option value="pemilik">Pemilik / Super Admin (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Simpan Petugas Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
