import React from 'react';
import {
  Wheat,
  ShoppingCart,
  Scale,
  Cog,
  Warehouse,
  CreditCard,
  BarChart3,
  Bot,
  AlertTriangle,
  Building2,
  Clock,
  User,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { BusinessProfile, GrainStock, DebtCreditRecord, UserAccount } from '../types';
import { formatWeight } from '../services/storage';

export type TabType = 'pos' | 'purchase' | 'milling' | 'stock' | 'debt' | 'report' | 'ai';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  profile: BusinessProfile;
  grainStock: GrainStock;
  debtRecords: DebtCreditRecord[];
  currentUser: UserAccount | null;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLockScreen: () => void;
  onOpenStandee: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  grainStock,
  debtRecords,
  currentUser,
  onOpenSettings,
  onOpenLogin,
  onLockScreen,
  onOpenStandee,
}) => {
  // Count overdue or near-due debts/credits
  const today = new Date().toISOString().split('T')[0];
  const dueAlertCount = debtRecords.filter(
    (d) => d.status === 'aktif' && d.dueDate && d.dueDate <= today
  ).length;

  const totalGrainReady = grainStock.gkgKg;

  const allTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string; roles?: string[] }[] = [
    {
      id: 'pos',
      label: 'Kasir Penjualan',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'purchase',
      label: 'Beli Gabah & Rafaksi',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'milling',
      label: 'Jasa Giling Padi',
      icon: <Cog className="w-4 h-4" />,
    },
    {
      id: 'stock',
      label: 'Stok & Gudang',
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      id: 'debt',
      label: 'Hutang & Piutang',
      icon: <CreditCard className="w-4 h-4" />,
      badge: dueAlertCount > 0 ? dueAlertCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'report',
      label: 'Laba Rugi & Kas',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'ai',
      label: 'Asisten AI Kilang',
      icon: <Bot className="w-4 h-4" />,
      badge: 'Gemini 3.8',
      badgeColor: 'bg-emerald-600 text-white text-[10px]',
    },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 shadow-md border-b border-slate-800 sticky top-0 z-40">
      {/* Top Quick Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Operasional Aktif
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
              <span>Gabah Siap Giling:</span>
              <strong className="text-amber-300 font-semibold">{formatWeight(totalGrainReady)}</strong>
            </div>

            {dueAlertCount > 0 && (
              <div
                onClick={() => onSelectTab('debt')}
                className="cursor-pointer flex items-center gap-1.5 bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-800/80 hover:bg-red-900 transition-colors"
                title="Ada transaksi jatuh tempo hari ini/lewat tempo"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{dueAlertCount} Tempo</span>
              </div>
            )}

            {/* User Profile & Login Menu in Top Bar */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                <div
                  className={`w-5 h-5 rounded-md bg-gradient-to-br ${currentUser.avatarColor} text-white flex items-center justify-center text-[10px] font-black`}
                >
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200 text-xs hidden md:inline">{currentUser.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded transition-colors"
                  title="Ganti Petugas / Switch User"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={onLockScreen}
                  className="text-slate-400 hover:text-red-400 hover:bg-slate-700 p-1 rounded transition-colors"
                  title="Kunci Layar Kasir / Logout"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Menu Login</span>
              </button>
            )}

            <button
              onClick={onOpenStandee}
              className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-2 py-0.5 rounded border border-red-500/40 transition-colors font-bold text-xs"
              title="Lihat Kode QRIS Toko Resmi"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>Kode QRIS</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Pengaturan Profil Usaha"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Profil</span>
            </button>
          </div>
        </div>

        {/* Main Branding & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-slate-950 font-black">
              <Wheat className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {profile.name}
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  POS & AI Terpadu
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">{profile.tagline}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {allTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        tab.badgeColor || 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Menu Login Button in Navbar */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:text-slate-950 hover:bg-amber-400 border border-amber-500/40 transition-colors ml-1"
              title="Buka Menu Login Petugas / Switch User"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu Login</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
