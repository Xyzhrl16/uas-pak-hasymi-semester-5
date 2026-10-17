import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  Wheat,
  User,
  Phone,
  Banknote,
  QrCode,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  History,
} from 'lucide-react';
import { Product, SaleItem, SaleTransaction, StockMutation, DebtCreditRecord, BusinessProfile } from '../types';
import { formatRupiah, formatWeight, formatDateIndo } from '../services/storage';
import { QrisPaymentCard } from './QrisPaymentCard';
import { QrisStandeeModal } from './QrisStandeeModal';

interface PosSaleTabProps {
  products: Product[];
  profile: BusinessProfile;
  recentSales?: SaleTransaction[];
  onCompleteSale: (
    sale: SaleTransaction,
    updatedProducts: Product[],
    newMutation: StockMutation[],
    newReceivable?: DebtCreditRecord
  ) => void;
  onReprintReceipt?: (sale: SaleTransaction) => void;
}

export const PosSaleTab: React.FC<PosSaleTabProps> = ({
  products,
  profile,
  recentSales = [],
  onCompleteSale,
  onReprintReceipt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Customer & Payment Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer' | 'kasbon'>('tunai');
  const [isQrisConfirmed, setIsQrisConfirmed] = useState<boolean>(false);
  const [showStandeeModal, setShowStandeeModal] = useState<boolean>(false);
  const [showRecentSales, setShowRecentSales] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'semua'
        ? true
        : selectedCategory === 'karung'
        ? p.category === 'beras' && p.unit.startsWith('karung')
        : selectedCategory === 'eceran'
        ? p.category === 'beras' && p.unit === 'kg'
        : selectedCategory === 'dedak'
        ? p.category === 'dedak'
        : selectedCategory === 'menir'
        ? p.category === 'menir' || p.category === 'sekam'
        : p.category === selectedCategory;

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stockUnit <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockUnit) return prevCart; // Cap at stock
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.pricePerUnit }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitWeightKg: product.unitWeightKg,
          quantity: 1,
          pricePerUnit: product.pricePerUnit,
          subtotal: product.pricePerUnit,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const maxStock = product ? product.stockUnit : 9999;
            const newQty = Math.max(1, Math.min(item.quantity + delta, maxStock));
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.pricePerUnit,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setIsQrisConfirmed(false);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalKg = cart.reduce((sum, item) => sum + item.quantity * item.unitWeightKg, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  // Auto set paidAmount if tunai or transfer
  const handleSetQuickCash = (amount: number) => {
    setPaidAmount(amount);
  };

  const changeAmount = paymentMethod === 'tunai' ? Math.max(0, paidAmount - finalTotal) : 0;
  const remainingDue = paymentMethod === 'kasbon' ? Math.max(0, finalTotal - paidAmount) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Nama pelanggan wajib diisi!');
      return;
    }
    if (paymentMethod === 'kasbon' && !dueDate) {
      alert('Untuk pembayaran kasbon/tempo, tanggal jatuh tempo wajib diisi!');
      return;
    }

    const invoiceNumber = `PJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const createdAt = new Date().toISOString();

    const sale: SaleTransaction = {
      id: `sal-${Date.now()}`,
      invoiceNumber,
      createdAt,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart,
      totalKg,
      subtotal,
      discount,
      finalTotal,
      paymentMethod,
      paidAmount: paymentMethod === 'kasbon' ? paidAmount : Math.max(paidAmount, finalTotal),
      changeAmount,
      remainingDue,
      dueDate: paymentMethod === 'kasbon' ? dueDate : undefined,
      status: paymentMethod === 'kasbon' && remainingDue > 0 ? 'belum_lunas' : 'lunas',
      notes,
    };

    // Deduct products stock
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((c) => c.productId === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stockUnit: Math.max(0, prod.stockUnit - cartItem.quantity),
        };
      }
      return prod;
    });

    // Create mutations
    const newMutations: StockMutation[] = cart.map((item) => ({
      id: `mut-${Date.now()}-${item.productId}`,
      date: createdAt,
      productName: item.productName,
      category: item.productName.toLowerCase().includes('dedak')
        ? 'dedak'
        : item.productName.toLowerCase().includes('menir')
        ? 'menir'
        : 'beras',
      type: 'keluar',
      quantityKg: item.quantity * item.unitWeightKg,
      reference: `Penjualan #${invoiceNumber}`,
      notes: `Ke ${customerName} (${item.quantity} ${item.unit})`,
    }));

    // If kasbon, create receivable record
    let newReceivable: DebtCreditRecord | undefined = undefined;
    if (paymentMethod === 'kasbon' && remainingDue > 0) {
      newReceivable = {
        id: `dc-${Date.now()}`,
        type: 'piutang_pelanggan',
        contactName: customerName,
        contactPhone: customerPhone,
        referenceInvoice: invoiceNumber,
        description: `Kasbon pembelian ${cart.map((c) => `${c.productName} (${c.quantity})`).join(', ')}`,
        initialAmount: remainingDue,
        remainingAmount: remainingDue,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'aktif',
        createdAt,
        payments: [],
      };
    }

    onCompleteSale(sale, updatedProducts, newMutations, newReceivable);
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left: Product Catalog */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Categories */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-800">Kasir & Katalog Beras</span>
            </div>

            <div className="flex items-center gap-2">
              {recentSales.length > 0 && onReprintReceipt && (
                <>
                  <button
                    type="button"
                    onClick={() => onReprintReceipt(recentSales[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 transition-colors shadow-2xs"
                    title="Cetak ulang struk nota penjualan paling akhir"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cetak Ulang Struk Terakhir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRecentSales(!showRecentSales)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat ({recentSales.length})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Recent Sales Reprint Drawer */}
          {showRecentSales && recentSales.length > 0 && onReprintReceipt && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-in text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Transaksi untuk Cetak Struk:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowRecentSales(false)}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {recentSales.slice(0, 6).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 font-mono text-[11px]">
                        {sale.invoiceNumber} • <span className="font-sans font-semibold text-slate-700">{sale.customerName || 'Pelanggan Umum'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDateIndo(sale.createdAt)} • {sale.items.length} item • {sale.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {formatRupiah(sale.finalTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onReprintReceipt(sale)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-bold transition-all shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-amber-400" />
                        <span>Cetak</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari Beras Super, Ciherang, Pandan Wangi, Dedak, Menir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'semua', label: 'Semua Produk' },
              { id: 'karung', label: 'Beras Karung' },
              { id: 'eceran', label: 'Beras Eceran (kg)' },
              { id: 'dedak', label: 'Dedak / Katul' },
              { id: 'menir', label: 'Menir & Sekam' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.productId === product.id);
            const isOutOfStock = product.stockUnit <= 0;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all select-none cursor-pointer ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                    : inCart
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        product.category === 'beras'
                          ? 'bg-amber-100 text-amber-800'
                          : product.category === 'dedak'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {product.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        product.stockUnit <= product.minStockAlert ? 'text-red-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      Stok: {product.stockUnit} {product.unit === 'kg' ? 'kg' : 'krg'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{product.name}</h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{formatRupiah(product.pricePerUnit)}</span>

                  {inCart ? (
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                      {inCart.quantity}
                    </span>
                  ) : (
                    <button
                      disabled={isOutOfStock}
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Cart & Checkout Form */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900">Keranjang Kasir</h3>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {cart.length} item
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="py-3 flex-1 overflow-y-auto max-h-56 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">Keranjang masih kosong.</p>
                <p className="text-[11px] text-slate-400">Pilih Beras atau Dedak di sebelah kiri.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatRupiah(item.pricePerUnit)} / {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-l transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-r transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-900 w-20 text-right">
                      {formatRupiah(item.subtotal)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Payment Inputs */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Pelanggan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Berkah / Bu Siti"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  No. WhatsApp (Nota)
                </label>
                <input
                  type="text"
                  placeholder="08123xxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Subtotal, Diskon & Total */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({formatWeight(totalKg)}):</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Diskon/Potongan (Rp):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 text-right px-2 py-0.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AKHIR:</span>
                <span className="text-amber-600 font-mono">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">Metode Pembayaran:</label>
                <button
                  type="button"
                  onClick={() => setShowStandeeModal(true)}
                  className="text-[10px] text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1"
                >
                  <QrCode className="w-3 h-3 text-red-600" />
                  <span>Standee QRIS Toko</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('tunai');
                    setPaidAmount(finalTotal);
                    setIsQrisConfirmed(false);
                  }}
                  className={`py-1.5 px-1 rounded-lg font-bold border transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    paymentMethod === 'tunai'
                      ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('qris');
                    setPaidAmount(finalTotal);
                  }}
                  className={`py-1.5 px-1 rounded-lg font-bold border transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 relative ${
                    paymentMethod === 'qris'
                      ? 'bg-red-600 border-red-700 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
                  <span>QRIS</span>
                  <span className="hidden sm:inline text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-black">
                    Scan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('transfer');
                    setPaidAmount(finalTotal);
                    setIsQrisConfirmed(false);
                  }}
                  className={`py-1.5 px-1 rounded-lg font-bold border transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    paymentMethod === 'transfer'
                      ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('kasbon');
                    setPaidAmount(0);
                    setIsQrisConfirmed(false);
                  }}
                  className={`py-1.5 px-1 rounded-lg font-bold border transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    paymentMethod === 'kasbon'
                      ? 'bg-red-500 border-red-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Kasbon</span>
                </button>
              </div>
            </div>

            {/* QRIS Code Payment Display */}
            {paymentMethod === 'qris' && (
              <div className="pt-1">
                <QrisPaymentCard
                  amount={finalTotal}
                  profile={profile}
                  customerName={customerName || 'Pelanggan Toko'}
                  isConfirmed={isQrisConfirmed}
                  onPaymentConfirmed={() => {
                    setIsQrisConfirmed(true);
                    setPaidAmount(finalTotal);
                  }}
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
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-600">Total Ditransfer:</span>
                  <strong className="font-mono text-emerald-800 text-sm">{formatRupiah(finalTotal)}</strong>
                </div>
              </div>
            )}

            {/* Tunai Quick Cash Buttons */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Nominal Diterima:</span>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-32 text-right px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetQuickCash(finalTotal)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetQuickCash(amt)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                {changeAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <span>Kembalian:</span>
                    <span className="font-mono text-sm">{formatRupiah(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Kasbon / Tempo Form */}
            {paymentMethod === 'kasbon' && (
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-medium">Uang Muka / Bayar Awal (DP):</span>
                  <input
                    type="number"
                    min="0"
                    max={finalTotal}
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-28 text-right px-2 py-0.5 bg-white border border-red-300 rounded font-mono text-xs"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-semibold">Tgl Jatuh Tempo *:</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-red-300 rounded text-xs"
                    required
                  />
                </div>

                <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-red-200">
                  <span>Sisa Piutang (Kasbon):</span>
                  <span className="font-mono">{formatRupiah(remainingDue)}</span>
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
                  <span className="font-bold text-slate-900 block">Cetak Struk Kasir Aktif</span>
                  <span className="text-[10px] text-slate-600 block">
                    Kertas Thermal: {profile.printerPaperWidth || '58mm'} • {profile.autoPrintReceipt !== false ? 'Otomatis' : 'Manual'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                SIAP CETAK
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Setujui Transaksi & Cetak Struk</span>
              <Printer className="w-4 h-4 text-emerald-200" />
            </button>
          </form>
        </div>
      </div>
      {/* Standee QRIS Toko Modal */}
      <QrisStandeeModal
        isOpen={showStandeeModal}
        onClose={() => setShowStandeeModal(false)}
        profile={profile}
      />
    </div>
  );
};
