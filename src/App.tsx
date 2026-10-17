/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { PosSaleTab } from './components/PosSaleTab';
import { GrainPurchaseTab } from './components/GrainPurchaseTab';
import { MillingServiceTab } from './components/MillingServiceTab';
import { StockWarehouseTab } from './components/StockWarehouseTab';
import { DebtCreditTab } from './components/DebtCreditTab';
import { ProfitLossReportTab } from './components/ProfitLossReportTab';
import { AiAssistantTab } from './components/AiAssistantTab';
import {
  TransactionReceiptModal,
  ReceiptTransaction,
} from './components/TransactionReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { QrisStandeeModal } from './components/QrisStandeeModal';
import {
  Product,
  GrainStock,
  SaleTransaction,
  PurchaseTransaction,
  MillingTransaction,
  DebtCreditRecord,
  StockMutation,
  OperationalExpense,
  BusinessProfile,
  UserAccount,
} from './types';
import {
  defaultProfile,
  defaultProducts,
  defaultGrainStock,
  defaultSales,
  defaultPurchases,
  defaultMilling,
  defaultDebtCredit,
  defaultExpenses,
  defaultMutations,
  defaultUsers,
  loadFromStorage,
  saveToStorage,
} from './services/storage';
import { ShieldAlert, KeyRound, LogOut } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('pos');

  // Persistence State
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    loadFromStorage('srikandi_rmu_profile', defaultProfile)
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage('srikandi_rmu_products', defaultProducts)
  );
  const [grainStock, setGrainStock] = useState<GrainStock>(() =>
    loadFromStorage('srikandi_rmu_grain_stock', defaultGrainStock)
  );
  const [sales, setSales] = useState<SaleTransaction[]>(() =>
    loadFromStorage('srikandi_rmu_sales', defaultSales)
  );
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() =>
    loadFromStorage('srikandi_rmu_purchases', defaultPurchases)
  );
  const [milling, setMilling] = useState<MillingTransaction[]>(() =>
    loadFromStorage('srikandi_rmu_milling', defaultMilling)
  );
  const [debtRecords, setDebtRecords] = useState<DebtCreditRecord[]>(() =>
    loadFromStorage('srikandi_rmu_debt_credit', defaultDebtCredit)
  );
  const [mutations, setMutations] = useState<StockMutation[]>(() =>
    loadFromStorage('srikandi_rmu_mutations', defaultMutations)
  );
  const [expenses, setExpenses] = useState<OperationalExpense[]>(() =>
    loadFromStorage('srikandi_rmu_expenses', defaultExpenses)
  );

  // Users & Authentication State
  const [users, setUsers] = useState<UserAccount[]>(() =>
    loadFromStorage('srikandi_rmu_users', defaultUsers)
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadFromStorage('srikandi_rmu_current_user', null)
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return loadFromStorage('srikandi_rmu_is_authenticated', false);
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // Modals
  const [receiptModalTx, setReceiptModalTx] = useState<ReceiptTransaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStandeeModalOpen, setIsStandeeModalOpen] = useState(false);

  // Sync to storage on updates
  useEffect(() => {
    saveToStorage('srikandi_rmu_profile', profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_products', products);
  }, [products]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_grain_stock', grainStock);
  }, [grainStock]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_sales', sales);
  }, [sales]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_purchases', purchases);
  }, [purchases]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_milling', milling);
  }, [milling]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_debt_credit', debtRecords);
  }, [debtRecords]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_mutations', mutations);
  }, [mutations]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_users', users);
  }, [users]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_current_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveToStorage('srikandi_rmu_is_authenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Migration hook to ensure new owner and staff names take effect immediately
  useEffect(() => {
    if (profile.ownerName !== 'Bpk. Kamsono') {
      setProfile((prev) => ({ ...prev, ownerName: 'Bpk. Kamsono' }));
    }
    if (users.some((u) => u.name === 'H. Sutrisno' || u.name === 'Mbak Dewi' || u.name === 'Mas Joko' || u.name === 'Pak Wandi')) {
      setUsers(defaultUsers);
      if (currentUser && (currentUser.name === 'H. Sutrisno' || currentUser.name === 'Mbak Dewi' || currentUser.name === 'Mas Joko' || currentUser.name === 'Pak Wandi')) {
        setCurrentUser(defaultUsers[0]);
      }
    }
  }, []);

  // Handlers for authentication
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
    setIsScreenLocked(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginModalOpen(false);
    setIsScreenLocked(false);
  };

  const handleLockScreen = () => {
    setIsAuthenticated(false);
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [...prev, newUser]);
  };

  // Handlers for transactions
  const handleCompleteSale = (
    sale: SaleTransaction,
    updatedProducts: Product[],
    newMutations: StockMutation[],
    newReceivable?: DebtCreditRecord
  ) => {
    setSales((prev) => [sale, ...prev]);
    setProducts(updatedProducts);
    setMutations((prev) => [...newMutations, ...prev]);
    if (newReceivable) {
      setDebtRecords((prev) => [newReceivable, ...prev]);
    }
    setReceiptModalTx({ type: 'sale', data: sale });
  };

  const handleCompletePurchase = (
    purchase: PurchaseTransaction,
    updatedGrainStock: GrainStock,
    newDebt?: DebtCreditRecord,
    newMutation?: StockMutation
  ) => {
    setPurchases((prev) => [purchase, ...prev]);
    setGrainStock(updatedGrainStock);
    if (newMutation) {
      setMutations((prev) => [newMutation, ...prev]);
    }
    if (newDebt) {
      setDebtRecords((prev) => [newDebt, ...prev]);
    }
    setReceiptModalTx({ type: 'purchase', data: purchase });
  };

  const handleCompleteMilling = (
    mil: MillingTransaction,
    updatedProducts: Product[],
    newMutations: StockMutation[],
    newReceivable?: DebtCreditRecord
  ) => {
    setMilling((prev) => [mil, ...prev]);
    setProducts(updatedProducts);
    if (newMutations.length > 0) {
      setMutations((prev) => [...newMutations, ...prev]);
    }
    if (newReceivable) {
      setDebtRecords((prev) => [newReceivable, ...prev]);
    }
    setReceiptModalTx({ type: 'milling', data: mil });
  };

  const handleAddExpense = (expense: OperationalExpense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const handleRecordPaymentCashflow = (
    type: 'masuk' | 'keluar',
    amount: number,
    desc: string
  ) => {
    if (type === 'keluar') {
      const exp: OperationalExpense = {
        id: `exp-${Date.now()}`,
        date: new Date().toISOString(),
        category: 'lain_lain',
        amount,
        description: desc,
        recordedBy: currentUser ? `${currentUser.name} (${currentUser.roleLabel})` : 'Kasir',
      };
      setExpenses((prev) => [exp, ...prev]);
    }
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin memulihkan data demo awal penggilingan padi?')) {
      localStorage.clear();
      setProfile(defaultProfile);
      setProducts(defaultProducts);
      setGrainStock(defaultGrainStock);
      setSales(defaultSales);
      setPurchases(defaultPurchases);
      setMilling(defaultMilling);
      setDebtRecords(defaultDebtCredit);
      setExpenses(defaultExpenses);
      setMutations(defaultMutations);
      setUsers(defaultUsers);
      setCurrentUser(defaultUsers[0]);
      alert('Data demo berhasil dipulihkan!');
    }
  };

  // Check role permission for report tab
  const isReportRestricted = currentTab === 'report' && currentUser?.role !== 'pemilik';

  // If not logged in, render the full Login Page
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        users={users}
        profile={profile}
        onLoginSuccess={handleLogin}
        onAddUser={handleAddUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Header with Login & User Profile */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        grainStock={grainStock}
        debtRecords={debtRecords}
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLockScreen={handleLogout}
        onOpenStandee={() => setIsStandeeModalOpen(true)}
      />

      {/* Main Tab View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 no-print">
        {/* If report is clicked by a cashier or operator */}
        {isReportRestricted ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4 my-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Akses Menu Terbatas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan Keuangan & Laba Rugi hanya dapat diakses oleh akun <strong>Pemilik Kilang / Direktur</strong>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              Petugas aktif saat ini: <strong>{currentUser?.name}</strong> ({currentUser?.roleLabel})
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ganti ke Akun Pemilik (Login)</span>
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'pos' && (
              <PosSaleTab
                products={products}
                profile={profile}
                recentSales={sales}
                onCompleteSale={handleCompleteSale}
                onReprintReceipt={(sale) => setReceiptModalTx({ type: 'sale', data: sale })}
              />
            )}

            {currentTab === 'purchase' && (
              <GrainPurchaseTab
                profile={profile}
                grainStock={grainStock}
                products={products}
                recentPurchases={purchases}
                onCompletePurchase={handleCompletePurchase}
                onReprintReceipt={(purchase) => setReceiptModalTx({ type: 'purchase', data: purchase })}
              />
            )}

            {currentTab === 'milling' && (
              <MillingServiceTab
                profile={profile}
                products={products}
                recentMilling={milling}
                onCompleteMilling={handleCompleteMilling}
                onReprintReceipt={(mil) => setReceiptModalTx({ type: 'milling', data: mil })}
              />
            )}

            {currentTab === 'stock' && (
              <StockWarehouseTab
                products={products}
                grainStock={grainStock}
                mutations={mutations}
                onUpdateProducts={setProducts}
                onUpdateGrainStock={setGrainStock}
                onAddMutation={(m) => setMutations((prev) => [m, ...prev])}
              />
            )}

            {currentTab === 'debt' && (
              <DebtCreditTab
                records={debtRecords}
                profile={profile}
                onUpdateRecords={setDebtRecords}
                onRecordPaymentCashflow={handleRecordPaymentCashflow}
              />
            )}

            {currentTab === 'report' && (
              <ProfitLossReportTab
                sales={sales}
                purchases={purchases}
                milling={milling}
                expenses={expenses}
                profile={profile}
                onAddExpense={handleAddExpense}
              />
            )}

            {currentTab === 'ai' && (
              <AiAssistantTab
                profile={profile}
                grainStock={grainStock}
                products={products}
              />
            )}
          </>
        )}
      </main>

      {/* Menu Login & Switch Operator Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || isScreenLocked}
        isLockedScreen={isScreenLocked}
        users={users}
        currentUser={currentUser}
        profile={profile}
        onLogin={handleLogin}
        onClose={() => setIsLoginModalOpen(false)}
        onAddUser={handleAddUser}
      />

      {/* Transaction Approval & Output Modal (Thermal Struk & WhatsApp Draft) */}
      <TransactionReceiptModal
        transaction={receiptModalTx}
        profile={profile}
        onClose={() => setReceiptModalTx(null)}
      />

      {/* Business Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        profile={profile}
        onSave={setProfile}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Standee QRIS Toko Modal from Navbar */}
      <QrisStandeeModal
        isOpen={isStandeeModalOpen}
        profile={profile}
        onClose={() => setIsStandeeModalOpen(false)}
      />

      {/* Clean Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs text-center no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>
              {profile.name} © 2026 • Sistem POS Penggilingan Padi & Tata Niaga Beras
            </span>
            {currentUser && (
              <span className="text-emerald-400 font-medium">
                • Operator Aktif: <strong>{currentUser.name}</strong> ({currentUser.roleLabel})
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
            >
              Ganti Petugas
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-4 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar / Kunci Layar</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-300 hover:text-white underline underline-offset-4"
            >
              Ubah Profil Kilang
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              Reset Data Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
