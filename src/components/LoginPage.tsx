import React, { useState } from 'react';
import {
  Wheat,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Delete,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserAccount, UserRole, BusinessProfile } from '../types';

interface LoginPageProps {
  users: UserAccount[];
  profile: BusinessProfile;
  onLoginSuccess: (user: UserAccount) => void;
  onAddUser?: (newUser: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  profile,
  onLoginSuccess,
  onAddUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserAccount>(users[0]);
  const [activeTab, setActiveTab] = useState<'quick_pin' | 'username_password'>('quick_pin');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

  // New staff form
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('kasir');

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        if (nextPin === selectedUser.pin) {
          onLoginSuccess(selectedUser);
        } else {
          setErrorMessage('PIN salah! Silakan coba lagi.');
          setEnteredPin('');
        }
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

  const handleQuickLogin = (user: UserAccount) => {
    onLoginSuccess(user);
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
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
      onLoginSuccess(found);
    } else {
      setErrorMessage('Username atau kata sandi/PIN tidak sesuai.');
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
    alert(`Petugas ${newUser.name} berhasil didaftarkan.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {profile.name}
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                Sistem POS & AI
              </span>
            </h1>
            <p className="text-xs text-slate-400">{profile.tagline}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </header>

      {/* Main Center Login Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-xl w-full overflow-hidden flex flex-col">
          {/* Card Title Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 text-center relative">
            <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-white">Masuk ke Sistem Penggilingan Padi</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Silakan pilih profil petugas Anda atau masuk dengan PIN / Akun
            </p>
          </div>

          {/* Login Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('quick_pin');
                setErrorMessage('');
              }}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'quick_pin'
                  ? 'border-amber-500 text-slate-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Pilih Petugas & PIN Cepat</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('username_password');
                setErrorMessage('');
              }}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'username_password'
                  ? 'border-amber-500 text-slate-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Username & Kata Sandi</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {activeTab === 'quick_pin' ? (
              <div className="space-y-4">
                {/* 4 Staff Cards Grid */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Pilih Petugas Bertugas:
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
                          <div className="flex items-center justify-between mb-1">
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
                            <span className="text-amber-700 font-semibold uppercase">{u.role}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PIN Input and Pad */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="text-xs text-slate-600">
                    Masukkan PIN untuk <strong className="text-slate-900">{selectedUser.name}</strong>:
                  </div>

                  {/* Dots */}
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

                  {/* Virtual Touchpad */}
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

                  {/* 1-Click Fast Login Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(selectedUser)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99] mt-2"
                  >
                    <span>Masuk Langsung sebagai {selectedUser.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Username & Password Mode */
              <form onSubmit={handleCredentialLogin} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username Petugas</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="pemilik / kasir / timbangan / gudang"
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
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 text-[11px]">
                  Peran Terpilih: <strong>{selectedUser.roleLabel}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline"
              >
                + Tambah Kasir
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>
          {profile.name} • {profile.address} • Telp/WA: {profile.phone}
        </p>
      </footer>

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
