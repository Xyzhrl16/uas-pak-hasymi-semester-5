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
  RafaksiDetail,
  UserAccount,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'srikandi_rmu_profile',
  PRODUCTS: 'srikandi_rmu_products',
  GRAIN_STOCK: 'srikandi_rmu_grain_stock',
  SALES: 'srikandi_rmu_sales',
  PURCHASES: 'srikandi_rmu_purchases',
  MILLING: 'srikandi_rmu_milling',
  DEBT_CREDIT: 'srikandi_rmu_debt_credit',
  MUTATIONS: 'srikandi_rmu_mutations',
  EXPENSES: 'srikandi_rmu_expenses',
  USERS: 'srikandi_rmu_users',
  CURRENT_USER: 'srikandi_rmu_current_user',
};

export const defaultUsers: UserAccount[] = [
  {
    id: 'user-1',
    name: 'Bpk. Kamsono',
    username: 'kamsono',
    pin: '1234',
    role: 'pemilik',
    roleLabel: 'Pemilik Kilang / Direktur',
    avatarColor: 'from-amber-500 to-amber-700',
    shiftSchedule: 'Penuh (Akses Semua Menu)',
  },
  {
    id: 'user-2',
    name: 'Mas Arul',
    username: 'arul',
    pin: '2222',
    role: 'kasir',
    roleLabel: 'Kasir Penjualan Beras',
    avatarColor: 'from-emerald-500 to-teal-700',
    shiftSchedule: 'Shift Pagi (07.00 - 15.00)',
  },
  {
    id: 'user-3',
    name: 'Mas Diwang',
    username: 'diwang',
    pin: '3333',
    role: 'operator_timbangan',
    roleLabel: 'Operator Timbangan dan Gilingan',
    avatarColor: 'from-blue-500 to-indigo-700',
    shiftSchedule: 'Shift Harian (07.30 - 17.00)',
  },
  {
    id: 'user-4',
    name: 'Mas Wiwit',
    username: 'wiwit',
    pin: '4444',
    role: 'operator_gilingan_antar',
    roleLabel: 'Operator Gilingan dan Antar Jemput Barang',
    avatarColor: 'from-indigo-600 to-cyan-700',
    shiftSchedule: 'Shift Operasional & Logistik Armada',
  },
];

export const defaultProfile: BusinessProfile = {
  name: 'Kilang Padi & Beras Sumber Makmur',
  tagline: 'Giling Padi Cepat, Beras Bersih & Putih Alami',
  address: 'Jl. Raya Pertanian No. 88, Desa Sukamaju, Jawa Tengah',
  phone: '081234567890',
  ownerName: 'Bpk. Kamsono',
  receiptFooter: 'Terima kasih atas kerja sama Anda. Beras berkah dari bumi nusantara.',
  cashFeeRatePerKg: 600, // Rp 600 per kg upah giling tunai
  standardMoisture: 14.0, // Standar SNI Gabah Kering Giling 14%
  qrisNmid: 'ID1024356789123',
  qrisMerchantName: 'SUMBER MAKMUR RICE MILL',
  autoPrintReceipt: true, // Aktifkan cetak struk otomatis
  printerPaperWidth: '58mm',
  printCopies: 1,
  showQrisOnReceipt: true,
};

export const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Beras Super Ramos (Karung 25kg)',
    category: 'beras',
    unit: 'karung_25kg',
    unitWeightKg: 25,
    pricePerUnit: 375000,
    costPerUnit: 335000,
    stockUnit: 48,
    minStockAlert: 10,
  },
  {
    id: 'prod-2',
    name: 'Beras Super Ramos (Karung 10kg)',
    category: 'beras',
    unit: 'karung_10kg',
    unitWeightKg: 10,
    pricePerUnit: 155000,
    costPerUnit: 135000,
    stockUnit: 60,
    minStockAlert: 15,
  },
  {
    id: 'prod-3',
    name: 'Beras Super Ramos (Karung 5kg)',
    category: 'beras',
    unit: 'karung_5kg',
    unitWeightKg: 5,
    pricePerUnit: 80000,
    costPerUnit: 68000,
    stockUnit: 75,
    minStockAlert: 20,
  },
  {
    id: 'prod-4',
    name: 'Beras Super Ramos (Eceran / kg)',
    category: 'beras',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 15500,
    costPerUnit: 13500,
    stockUnit: 650,
    minStockAlert: 100,
  },
  {
    id: 'prod-5',
    name: 'Beras Ciherang Medium (Karung 25kg)',
    category: 'beras',
    unit: 'karung_25kg',
    unitWeightKg: 25,
    pricePerUnit: 345000,
    costPerUnit: 305000,
    stockUnit: 40,
    minStockAlert: 10,
  },
  {
    id: 'prod-6',
    name: 'Beras Ciherang Medium (Eceran / kg)',
    category: 'beras',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 14000,
    costPerUnit: 12200,
    stockUnit: 820,
    minStockAlert: 150,
  },
  {
    id: 'prod-7',
    name: 'Beras Pandan Wangi Pulen (Karung 25kg)',
    category: 'beras',
    unit: 'karung_25kg',
    unitWeightKg: 25,
    pricePerUnit: 420000,
    costPerUnit: 370000,
    stockUnit: 25,
    minStockAlert: 5,
  },
  {
    id: 'prod-8',
    name: 'Beras Pandan Wangi Pulen (Eceran / kg)',
    category: 'beras',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 17500,
    costPerUnit: 14800,
    stockUnit: 340,
    minStockAlert: 50,
  },
  {
    id: 'prod-9',
    name: 'Dedak Halus / Katul Super (Karung 50kg)',
    category: 'dedak',
    unit: 'karung_50kg',
    unitWeightKg: 50,
    pricePerUnit: 220000,
    costPerUnit: 175000,
    stockUnit: 32,
    minStockAlert: 10,
  },
  {
    id: 'prod-10',
    name: 'Dedak Halus / Katul Super (Eceran / kg)',
    category: 'dedak',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 4600,
    costPerUnit: 3500,
    stockUnit: 580,
    minStockAlert: 100,
  },
  {
    id: 'prod-11',
    name: 'Dedak Kasar / Campur (Eceran / kg)',
    category: 'dedak',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 3200,
    costPerUnit: 2200,
    stockUnit: 310,
    minStockAlert: 50,
  },
  {
    id: 'prod-12',
    name: 'Menir Beras / Pecahan Halus (Eceran / kg)',
    category: 'menir',
    unit: 'kg',
    unitWeightKg: 1,
    pricePerUnit: 8500,
    costPerUnit: 6000,
    stockUnit: 260,
    minStockAlert: 50,
  },
  {
    id: 'prod-13',
    name: 'Sekam Padi Kering (Per Karung Besar)',
    category: 'sekam',
    unit: 'kg',
    unitWeightKg: 15,
    pricePerUnit: 15000,
    costPerUnit: 5000,
    stockUnit: 90,
    minStockAlert: 20,
  },
];

export const defaultGrainStock: GrainStock = {
  gkgKg: 5400,       // Gabah Kering Giling siap giling
  gkpKg: 8200,       // Gabah Kering Panen sedang antri jemur/masuk silo
  gabahBasahKg: 2800,// Gabah Basah segar dari sawah
};

export const defaultSales: SaleTransaction[] = [
  {
    id: 'sal-101',
    invoiceNumber: 'PJ-20261015-001',
    createdAt: '2026-10-15T08:30:00.000Z',
    customerName: 'Toko Sembako Berkah (Bu Siti)',
    customerPhone: '081298765432',
    items: [
      {
        productId: 'prod-1',
        productName: 'Beras Super Ramos (Karung 25kg)',
        unit: 'karung_25kg',
        unitWeightKg: 25,
        quantity: 4,
        pricePerUnit: 375000,
        subtotal: 1500000,
      },
      {
        productId: 'prod-9',
        productName: 'Dedak Halus / Katul Super (Karung 50kg)',
        unit: 'karung_50kg',
        unitWeightKg: 50,
        quantity: 2,
        pricePerUnit: 220000,
        subtotal: 440000,
      },
    ],
    totalKg: 200,
    subtotal: 1940000,
    discount: 20000,
    finalTotal: 1920000,
    paymentMethod: 'tunai',
    paidAmount: 2000000,
    changeAmount: 80000,
    remainingDue: 0,
    status: 'lunas',
    notes: 'Pengiriman langsung ke toko, langganan',
  },
  {
    id: 'sal-102',
    invoiceNumber: 'PJ-20261015-002',
    createdAt: '2026-10-15T09:45:00.000Z',
    customerName: 'Warung Nasi Bu Warno',
    customerPhone: '085712345678',
    items: [
      {
        productId: 'prod-5',
        productName: 'Beras Ciherang Medium (Karung 25kg)',
        unit: 'karung_25kg',
        unitWeightKg: 25,
        quantity: 2,
        pricePerUnit: 345000,
        subtotal: 690000,
      },
    ],
    totalKg: 50,
    subtotal: 690000,
    discount: 0,
    finalTotal: 690000,
    paymentMethod: 'kasbon',
    paidAmount: 200000,
    changeAmount: 0,
    remainingDue: 490000,
    dueDate: '2026-10-22',
    status: 'belum_lunas',
    notes: 'Uang muka Rp 200.000, sisa tempo 1 minggu',
  },
];

export const defaultPurchases: PurchaseTransaction[] = [
  {
    id: 'pur-201',
    invoiceNumber: 'PB-20261014-001',
    createdAt: '2026-10-14T10:15:00.000Z',
    supplierName: 'Pak Tarjo (Kelompok Tani Tunas Jaya)',
    supplierPhone: '081377889900',
    itemType: 'gabah_kering_panen',
    itemName: 'Gabah Kering Panen (GKP) Varietas Ciherang',
    rafaksi: {
      grossWeightKg: 2540,
      bagCount: 50,
      tarePerBagKg: 0.6,
      totalTareKg: 30,
      moisturePercent: 18.5,
      moistureRafaksiPercent: 3.5,
      impurityPercent: 1.0,
      totalRafaksiPercent: 4.5,
      totalRafaksiKg: 112.95,
      netWeightKg: 2397.05,
    },
    pricePerKg: 7200,
    totalAmount: 17258760,
    paymentMethod: 'tunai',
    paidAmount: 17258760,
    remainingDebt: 0,
    status: 'lunas',
    notes: 'Gabah bersih, panen sawah barat',
  },
  {
    id: 'pur-202',
    invoiceNumber: 'PB-20261015-001',
    createdAt: '2026-10-15T07:20:00.000Z',
    supplierName: 'Pak Sukiman (Pengepul Gabah Desa Sidorejo)',
    supplierPhone: '082166554433',
    itemType: 'gabah_basah',
    itemName: 'Gabah Basah Segar (Varietas Ramos)',
    rafaksi: {
      grossWeightKg: 3400,
      bagCount: 68,
      tarePerBagKg: 0.6,
      totalTareKg: 40.8,
      moisturePercent: 22.0,
      moistureRafaksiPercent: 7.0,
      impurityPercent: 1.5,
      totalRafaksiPercent: 8.5,
      totalRafaksiKg: 285.53,
      netWeightKg: 3073.67,
    },
    pricePerKg: 6400,
    totalAmount: 19671488,
    paymentMethod: 'utang_usaha',
    paidAmount: 10000000,
    remainingDebt: 9671488,
    dueDate: '2026-10-20',
    status: 'belum_lunas',
    notes: 'Kadar air tinggi 22%, langsung masuk lantai jemur. DP 10jt',
  },
];

export const defaultMilling: MillingTransaction[] = [
  {
    id: 'mil-301',
    invoiceNumber: 'JG-20261015-001',
    createdAt: '2026-10-15T08:00:00.000Z',
    customerName: 'Pak Kades Slamet',
    customerPhone: '081234111222',
    grainType: 'Gabah Kering Giling (IR-64)',
    grainWeightKg: 450,
    scheme: 'upah_tunai',
    feePerKg: 600,
    cashFeeTotal: 270000,
    estimatedRiceKg: 288,
    estimatedBranKg: 40.5,
    estimatedMenirKg: 13.5,
    customerTakeRiceKg: 288,
    customerTakeBranKg: 40.5,
    customerTakeMenirKg: 13.5,
    paymentStatus: 'lunas',
    paidAmount: 270000,
    notes: 'Giling rapi, beras dan katul dibawa pulang semua oleh petani',
  },
  {
    id: 'mil-302',
    invoiceNumber: 'JG-20261015-002',
    createdAt: '2026-10-15T09:15:00.000Z',
    customerName: 'Mbah Marjono',
    customerPhone: '085288990011',
    grainType: 'Gabah Ciherang',
    grainWeightKg: 600,
    scheme: 'potong_hasil_dedak',
    cashFeeTotal: 0,
    estimatedRiceKg: 384,
    estimatedBranKg: 54,
    estimatedMenirKg: 18,
    deductionBranKg: 54, // Semua dedak diambil kilang penggilingan sbg upah
    customerTakeRiceKg: 384,
    customerTakeBranKg: 0,
    customerTakeMenirKg: 18,
    paymentStatus: 'lunas',
    notes: 'Sistem Bawon/Tukar Dedak: Petani bebas ongkos tunai, seluruh dedak katul 54 kg masuk stok gudang kilang',
  },
];

export const defaultDebtCredit: DebtCreditRecord[] = [
  {
    id: 'dc-1',
    type: 'utang_ke_petani',
    contactName: 'Pak Sukiman (Pengepul Sidorejo)',
    contactPhone: '082166554433',
    referenceInvoice: 'PB-20261015-001',
    description: 'Sisa pembayaran pembelian gabah basah 3.073 kg',
    initialAmount: 9671488,
    remainingAmount: 9671488,
    dueDate: '2026-10-20',
    status: 'aktif',
    createdAt: '2026-10-15T07:20:00.000Z',
    payments: [],
  },
  {
    id: 'dc-2',
    type: 'piutang_pelanggan',
    contactName: 'Warung Nasi Bu Warno',
    contactPhone: '085712345678',
    referenceInvoice: 'PJ-20261015-002',
    description: 'Kasbon pengambilan beras Ciherang 2 karung @25kg',
    initialAmount: 490000,
    remainingAmount: 490000,
    dueDate: '2026-10-22',
    status: 'aktif',
    createdAt: '2026-10-15T09:45:00.000Z',
    payments: [],
  },
  {
    id: 'dc-3',
    type: 'piutang_pelanggan',
    contactName: 'Pak Kasirun (Petani Penggilingan)',
    contactPhone: '081987654321',
    referenceInvoice: 'JG-20261010-004',
    description: 'Sisa ongkos jasa giling gabah 500 kg tempo panen',
    initialAmount: 300000,
    remainingAmount: 150000,
    dueDate: '2026-10-16', // Besok jatuh tempo!
    status: 'jatuh_tempo',
    createdAt: '2026-10-10T14:00:00.000Z',
    payments: [
      {
        id: 'pay-1',
        date: '2026-10-13T10:00:00.000Z',
        amount: 150000,
        notes: 'Cicilan pertama diserahkan di rumah',
      },
    ],
  },
];

export const defaultExpenses: OperationalExpense[] = [
  {
    id: 'exp-1',
    date: '2026-10-14T08:00:00.000Z',
    category: 'solar_diesel',
    amount: 450000,
    description: 'Pembelian solar 65 liter untuk mesin penggilingan diesel Yanmar',
    recordedBy: 'Bpk. Kamsono',
  },
  {
    id: 'exp-2',
    date: '2026-10-14T16:30:00.000Z',
    category: 'perawatan_mesin',
    amount: 250000,
    description: 'Ganti oli mesin & penggantian saringan polisher (rubber roll)',
    recordedBy: 'Mas Diwang (Operator Gilingan)',
  },
  {
    id: 'exp-3',
    date: '2026-10-15T07:30:00.000Z',
    category: 'karung_dan_tali',
    amount: 180000,
    description: 'Beli 100 lembar karung beras 25kg + benang jahit karung',
    recordedBy: 'Kasir',
  },
];

export const defaultMutations: StockMutation[] = [
  {
    id: 'mut-1',
    date: '2026-10-15T08:30:00.000Z',
    productName: 'Beras Super Ramos (Karung 25kg)',
    category: 'beras',
    type: 'keluar',
    quantityKg: 100,
    reference: 'Penjualan #PJ-20261015-001',
    notes: '4 karung @25kg ke Toko Sembako Berkah',
  },
  {
    id: 'mut-2',
    date: '2026-10-15T08:30:00.000Z',
    productName: 'Dedak Halus / Katul Super (Karung 50kg)',
    category: 'dedak',
    type: 'keluar',
    quantityKg: 100,
    reference: 'Penjualan #PJ-20261015-001',
    notes: '2 karung @50kg',
  },
  {
    id: 'mut-3',
    date: '2026-10-15T09:15:00.000Z',
    productName: 'Dedak Halus / Katul Super (Eceran / kg)',
    category: 'dedak',
    type: 'masuk',
    quantityKg: 54,
    reference: 'Jasa Giling #JG-20261015-002',
    notes: 'Sistem Potong Hasil Bawon dari Mbah Marjono (54 kg dedak)',
  },
];

// Helper to get & set localStorage
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Formatters
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(kg: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(kg) + ' kg';
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Rafaksi Calculator Engine
export function calculateRafaksi(
  grossWeightKg: number,
  bagCount: number,
  tarePerBagKg: number = 0.6,
  moisturePercent: number = 14.0,
  baseMoistureTarget: number = 14.0,
  impurityPercent: number = 1.0
): RafaksiDetail {
  // Tara karung
  const totalTareKg = Math.max(0, bagCount * tarePerBagKg);
  const weightAfterTare = Math.max(0, grossWeightKg - totalTareKg);

  // Moisture deduction:
  // If moisture is higher than target (e.g. 18% vs 14%), deduction percentage applies
  // Typical milling industry standard: roughly 1.0% deduction per 1.0% excess moisture, or graded
  const excessMoisture = Math.max(0, moisturePercent - baseMoistureTarget);
  const moistureRafaksiPercent = Number(excessMoisture.toFixed(2));

  // Impurity deduction (kotoran/hampa)
  const totalRafaksiPercent = Number((moistureRafaksiPercent + impurityPercent).toFixed(2));

  // Potongan kg
  const totalRafaksiKg = Number(((weightAfterTare * totalRafaksiPercent) / 100).toFixed(2));
  const netWeightKg = Number(Math.max(0, weightAfterTare - totalRafaksiKg).toFixed(2));

  return {
    grossWeightKg,
    bagCount,
    tarePerBagKg,
    totalTareKg,
    moisturePercent,
    moistureRafaksiPercent,
    impurityPercent,
    totalRafaksiPercent,
    totalRafaksiKg,
    netWeightKg,
  };
}

// WhatsApp Note Message Generator
export function generateSaleWhatsAppText(sale: SaleTransaction, profile: BusinessProfile): string {
  const dateFormatted = formatDateIndo(sale.createdAt);
  let itemsList = '';
  sale.items.forEach((item, idx) => {
    itemsList += `${idx + 1}. *${item.productName}*\n   ${item.quantity} x ${formatRupiah(item.pricePerUnit)} = ${formatRupiah(item.subtotal)}\n`;
  });

  const paymentStatusText = sale.status === 'lunas' 
    ? '✅ *LUNAS*' 
    : `⏳ *KASBON/BELUM LUNAS*\n   *Sisa Tagihan:* ${formatRupiah(sale.remainingDue)}\n   *Jatuh Tempo:* ${sale.dueDate || '-'}`;

  return `🌾 *NOTA PENJUALAN BERAS & HASIL GILING*
*${profile.name.toUpperCase()}*
${profile.address}
Telp/WA: ${profile.phone}
----------------------------------------
No. Nota : *${sale.invoiceNumber}*
Tanggal  : ${dateFormatted}
Pelanggan: *${sale.customerName}*
----------------------------------------
*RINCIAN PRODUK:*
${itemsList}
----------------------------------------
Total Berat : ${formatWeight(sale.totalKg)}
Subtotal    : ${formatRupiah(sale.subtotal)}
Diskon      : ${formatRupiah(sale.discount)}
*TOTAL AKHIR : ${formatRupiah(sale.finalTotal)}*

Pembayaran  : ${sale.paymentMethod.toUpperCase()}
Nominal Bayar: ${formatRupiah(sale.paidAmount)}
${sale.changeAmount > 0 ? `Kembalian   : ${formatRupiah(sale.changeAmount)}\n` : ''}Status      : ${paymentStatusText}
----------------------------------------
${profile.receiptFooter}
_Simpan nota ini sebagai bukti transaksi resmi._`;
}

export function generatePurchaseWhatsAppText(pur: PurchaseTransaction, profile: BusinessProfile): string {
  const dateFormatted = formatDateIndo(pur.createdAt);
  const raf = pur.rafaksi;
  const paymentStatusText = pur.status === 'lunas'
    ? '✅ *LUNAS DIBAYARKAN*'
    : `⏳ *UTANG TEMPO*\n   *Sisa Pembayaran:* ${formatRupiah(pur.remainingDebt)}\n   *Jatuh Tempo:* ${pur.dueDate || '-'}`;

  return `🌾 *BUKTI TIMBANGAN & PEMBELIAN GABAH*
*${profile.name.toUpperCase()}*
${profile.address}
Telp/WA: ${profile.phone}
----------------------------------------
No. Timbangan : *${pur.invoiceNumber}*
Tanggal       : ${dateFormatted}
Petani/Pemasok: *${pur.supplierName}*
Komoditas     : ${pur.itemName}
----------------------------------------
*DETAIL TIMBANGAN & RAFAKSI:*
- Berat Bruto (Kotor) : ${formatWeight(raf.grossWeightKg)} (${raf.bagCount} Karung)
- Potongan Tara Karung: -${formatWeight(raf.totalTareKg)} (${raf.tarePerBagKg} kg/karung)
- Kadar Air           : ${raf.moisturePercent}% (Potongan: ${raf.moistureRafaksiPercent}%)
- Hampa / Kotoran     : ${raf.impurityPercent}%
- Total Rafaksi (%)   : ${raf.totalRafaksiPercent}%
- Total Potongan (Kg) : -${formatWeight(raf.totalRafaksiKg)}
----------------------------------------
*BERAT BERSIH (NETTO): ${formatWeight(raf.netWeightKg)}*
Harga per Kg          : ${formatRupiah(pur.pricePerKg)}
*TOTAL NILAI GABAH    : ${formatRupiah(pur.totalAmount)}*

Metode Bayar          : ${pur.paymentMethod.toUpperCase()}
Dibayarkan            : ${formatRupiah(pur.paidAmount)}
Status                : ${paymentStatusText}
----------------------------------------
${profile.receiptFooter}`;
}

export function generateMillingWhatsAppText(mil: MillingTransaction, profile: BusinessProfile): string {
  const dateFormatted = formatDateIndo(mil.createdAt);
  const schemeName = mil.scheme === 'upah_tunai' 
    ? `Upah Tunai (${formatRupiah(mil.feePerKg || 0)}/kg)`
    : mil.scheme === 'potong_hasil_dedak'
    ? 'Potong Hasil Dedak/Katul (Bawon Dedak)'
    : 'Potong Hasil Beras';

  return `🌾 *BUKTI JASA PENGGILINGAN PADI*
*${profile.name.toUpperCase()}*
${profile.address}
Telp/WA: ${profile.phone}
----------------------------------------
No. Antrean/Giling : *${mil.invoiceNumber}*
Tanggal            : ${dateFormatted}
Pelanggan / Petani : *${mil.customerName}*
Jenis Gabah        : ${mil.grainType}
*Berat Gabah Masuk : ${formatWeight(mil.grainWeightKg)}*
Skema Giling       : ${schemeName}
----------------------------------------
*RINCIAN HASIL GILING:*
🌾 Beras Bersih     : ${formatWeight(mil.estimatedRiceKg)} (Bawa Pulang: *${formatWeight(mil.customerTakeRiceKg)}*)
🌾 Dedak / Bekatul  : ${formatWeight(mil.estimatedBranKg)} (Bawa Pulang: *${formatWeight(mil.customerTakeBranKg)}*)
🌾 Menir Pecahan    : ${formatWeight(mil.estimatedMenirKg)} (Bawa Pulang: *${formatWeight(mil.customerTakeMenirKg)}*)
${mil.deductionBranKg ? `👉 Dedak Tinggal di Kilang (Upah): ${formatWeight(mil.deductionBranKg)}\n` : ''}${mil.deductionRiceKg ? `👉 Beras Tinggal di Kilang (Upah): ${formatWeight(mil.deductionRiceKg)}\n` : ''}----------------------------------------
${mil.scheme === 'upah_tunai' ? `*Total Ongkos Giling: ${formatRupiah(mil.cashFeeTotal || 0)}*\nStatus Pembayaran : ${mil.paymentStatus === 'lunas' ? '✅ Lunas Tunai' : '⏳ Kasbon/Tempo'}\n` : 'Ongkos Giling     : Bebas Tunai (Tukar Dedak/Hasil)\n'}----------------------------------------
${profile.receiptFooter}`;
}
