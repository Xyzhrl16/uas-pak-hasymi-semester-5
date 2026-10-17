export type ProductCategory = 'beras' | 'dedak' | 'menir' | 'sekam' | 'gabah';

export type PackageUnit = 'kg' | 'karung_5kg' | 'karung_10kg' | 'karung_25kg' | 'karung_50kg';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: PackageUnit;
  unitWeightKg: number; // e.g. 1 for kg, 25 for karung_25kg
  pricePerUnit: number; // Harga jual
  costPerUnit: number;  // Modal/HPP
  stockUnit: number;    // Jumlah unit tersedia (karung atau kg)
  minStockAlert: number;
}

export interface GrainStock {
  gkpKg: number;        // Gabah Kering Panen
  gkgKg: number;        // Gabah Kering Giling
  gabahBasahKg: number; // Gabah Basah / Baru Panen
}

export interface SaleItem {
  productId: string;
  productName: string;
  unit: PackageUnit;
  unitWeightKg: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string; // e.g. PJ-20261015-001
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  totalKg: number;
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentMethod: 'tunai' | 'transfer' | 'qris' | 'kasbon';
  paidAmount: number;
  changeAmount: number;
  remainingDue: number; // kasbon jika belum lunas
  dueDate?: string;
  status: 'lunas' | 'belum_lunas';
  notes?: string;
}

export interface RafaksiDetail {
  grossWeightKg: number;       // Berat Bruto timbangan
  bagCount: number;             // Jumlah karung
  tarePerBagKg: number;         // Tara per karung (biasanya 0.5 - 0.7 kg)
  totalTareKg: number;          // Total potongan tara karung
  moisturePercent: number;      // Kadar air (%) misal 18%
  moistureRafaksiPercent: number;// Potongan kadar air (%) misal 4%
  impurityPercent: number;      // Potongan hampa / kotoran (%)
  totalRafaksiPercent: number;  // Total persen potongan rafaksi
  totalRafaksiKg: number;       // Total potongan dalam kg
  netWeightKg: number;          // Berat Bersih (Netto) timbangan
}

export interface PurchaseTransaction {
  id: string;
  invoiceNumber: string; // e.g. PB-20261015-001
  createdAt: string;
  supplierName: string; // Nama petani / pengepul
  supplierPhone?: string;
  itemType: 'gabah_kering_panen' | 'gabah_kering_giling' | 'gabah_basah' | 'beras_petani';
  itemName: string;
  rafaksi: RafaksiDetail;
  pricePerKg: number;
  totalAmount: number;
  paymentMethod: 'tunai' | 'transfer' | 'utang_usaha';
  paidAmount: number;
  remainingDebt: number; // Utang yang belum dibayar ke petani
  dueDate?: string;
  status: 'lunas' | 'belum_lunas';
  notes?: string;
}

export type MillingScheme = 'upah_tunai' | 'potong_hasil_dedak' | 'potong_hasil_beras';

export interface MillingTransaction {
  id: string;
  invoiceNumber: string; // e.g. JG-20261015-001
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  grainType: string;
  grainWeightKg: number; // Berat gabah masuk
  
  // Skema biaya
  scheme: MillingScheme;
  feePerKg?: number;         // Upah giling per kg (jika upah tunai)
  cashFeeTotal?: number;      // Total rupiah upah tunai
  deductionBranKg?: number;  // Dedak yang diserahkan ke kilang sbg upah
  deductionRiceKg?: number;  // Beras yang diserahkan ke kilang sbg upah

  // Hasil giling
  estimatedRiceKg: number;   // Estimasi total beras
  estimatedBranKg: number;   // Estimasi total dedak
  estimatedMenirKg: number;  // Estimasi total menir
  
  // Yang dibawa pulang petani
  customerTakeRiceKg: number;
  customerTakeBranKg: number;
  customerTakeMenirKg: number;

  paymentStatus: 'lunas' | 'kasbon';
  paymentMethod?: 'tunai' | 'qris' | 'transfer' | 'kasbon';
  paidAmount?: number;
  remainingDue?: number;
  dueDate?: string;
  notes?: string;
}

export interface DebtCreditRecord {
  id: string;
  type: 'piutang_pelanggan' | 'utang_ke_petani'; // Piutang (kita nagih) vs Utang (kita bayar)
  contactName: string;
  contactPhone?: string;
  referenceInvoice: string;
  description: string;
  initialAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'aktif' | 'lunas' | 'jatuh_tempo';
  createdAt: string;
  payments: {
    id: string;
    date: string;
    amount: number;
    notes?: string;
  }[];
}

export interface StockMutation {
  id: string;
  date: string;
  productName: string;
  category: ProductCategory;
  type: 'masuk' | 'keluar' | 'penyesuaian';
  quantityKg: number;
  reference: string; // e.g. Penjualan #PJ-001, Giling Jasa, Pembelian Gabah
  notes?: string;
}

export interface OperationalExpense {
  id: string;
  date: string;
  category: 'solar_diesel' | 'listrik_pln' | 'perawatan_mesin' | 'upah_pekerja' | 'karung_dan_tali' | 'lain_lain';
  amount: number;
  description: string;
  recordedBy?: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  ownerName: string;
  receiptFooter: string;
  cashFeeRatePerKg: number; // default upah giling per kg
  standardMoisture: number; // default target kadar air gabah giling (14%)
  qrisNmid?: string;
  qrisMerchantName?: string;
  qrisCustomImageUrl?: string;
  autoPrintReceipt?: boolean; // Aktifkan cetak struk otomatis
  printerPaperWidth?: '58mm' | '80mm'; // Ukuran kertas thermal (58mm atau 80mm)
  printCopies?: 1 | 2; // Jumlah salinan (1 atau 2 rangkap)
  showQrisOnReceipt?: boolean; // Tampilkan verifikasi QRIS di struk
}

export type UserRole = 'pemilik' | 'kasir' | 'operator_timbangan' | 'kepala_gudang' | 'operator_gilingan_antar';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  pin: string; // 4 digit PIN
  password?: string;
  role: UserRole;
  roleLabel: string;
  avatarColor: string;
  shiftSchedule?: string;
}

