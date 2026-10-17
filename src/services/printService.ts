/**
 * Thermal Receipt Printing Engine
 * Supports 58mm and 80mm ESC/POS Thermal Printers, Web Bluetooth / RawBT, and Browser Print
 */
import { ReceiptTransaction } from '../components/TransactionReceiptModal';
import { BusinessProfile } from '../types';
import { formatRupiah, formatWeight, formatDateIndo } from './storage';

export interface PrintReceiptOptions {
  paperWidth?: '58mm' | '80mm';
  copies?: 1 | 2;
  title?: string;
}

/**
 * Print an element directly to a thermal printer using an isolated print iframe or popup.
 * This completely isolates the receipt from modal backdrops, fixed positions, or scrollbars.
 */
export function printReceiptElement(
  elementId: string,
  options: PrintReceiptOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const { paperWidth = '58mm', copies = 1, title = 'Struk Transaksi' } = options;
    const sourceElement = document.getElementById(elementId);

    if (!sourceElement) {
      console.warn(`Element #${elementId} not found for printing, fallback to window.print()`);
      window.print();
      resolve(true);
      return;
    }

    const receiptHtml = sourceElement.innerHTML;
    const widthInMm = paperWidth === '80mm' ? '72mm' : '48mm';
    const containerWidth = paperWidth === '80mm' ? '80mm' : '58mm';
    const fontSize = paperWidth === '80mm' ? '12px' : '10.5px';

    // Construct print documents with requested number of copies
    let contentToPrint = '';
    for (let i = 0; i < copies; i++) {
      const copyLabel =
        copies > 1
          ? `<div style="text-align: center; font-size: 9px; font-weight: bold; margin-bottom: 6px; padding: 2px 0; border-bottom: 1px dashed #000;">
              [ SALINAN ${i === 0 ? '1: UNTUK PELANGGAN' : '2: ARSIP KILANG'} ]
            </div>`
          : '';

      const cutDivider =
        copies > 1 && i < copies - 1
          ? `<div style="text-align: center; margin: 18px 0; font-size: 10px; border-top: 1px dashed #888; padding-top: 4px;">
              - - - - - - - - POTONG DISINI - - - - - - - -
            </div>`
          : '';

      contentToPrint += `
        <div class="receipt-copy" style="width: ${widthInMm}; margin: 0 auto; padding: 4px 0;">
          ${copyLabel}
          ${receiptHtml}
        </div>
        ${cutDivider}
      `;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      // Fallback to window.print if iframe document is not accessible
      window.print();
      document.body.removeChild(printFrame);
      resolve(true);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page {
              size: ${containerWidth} auto;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: ${containerWidth};
              margin: 0;
              padding: 4px;
              color: #000000;
              background-color: #ffffff;
              font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
              font-size: ${fontSize};
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            img {
              max-width: 100%;
              height: auto;
              filter: grayscale(100%) contrast(150%);
            }
            .no-print, button, svg {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .border-dashed {
              border-style: dashed !important;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-\\[9px\\] { font-size: 9px; }
            .text-\\[8px\\] { font-size: 8px; }
          </style>
        </head>
        <body>
          ${contentToPrint}
        </body>
      </html>
    `);
    doc.close();

    // Allow resources/images (like QR code) to render
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        resolve(true);
      } catch (err) {
        console.error('Print iframe error, calling window.print()', err);
        window.print();
        resolve(true);
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }
    }, 350);
  });
}

/**
 * Generate formatted plain-text receipt suitable for 32 columns (58mm) or 48 columns (80mm).
 * Can be sent directly to Bluetooth mini thermal printers via RawBT, Android intent, or clipboard.
 */
export function generatePlainTextReceipt(
  transaction: ReceiptTransaction,
  profile: BusinessProfile,
  paperWidth: '58mm' | '80mm' = '58mm'
): string {
  const cols = paperWidth === '80mm' ? 42 : 32;
  const divider = '='.repeat(cols);
  const thinDivider = '-'.repeat(cols);

  const center = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length >= cols) return trimmed.slice(0, cols);
    const pad = Math.floor((cols - trimmed.length) / 2);
    return ' '.repeat(pad) + trimmed;
  };

  const line2Cols = (left: string, right: string) => {
    const space = cols - left.length - right.length;
    if (space <= 0) return left + ' ' + right;
    return left + ' '.repeat(space) + right;
  };

  const lines: string[] = [];

  // Header
  lines.push(center(profile.name.toUpperCase()));
  if (profile.tagline) lines.push(center(profile.tagline));
  if (profile.address) lines.push(center(profile.address));
  if (profile.phone) lines.push(center(`Telp/WA: ${profile.phone}`));
  lines.push(divider);

  if (transaction.type === 'sale') {
    const s = transaction.data;
    lines.push(center('NOTA PENJUALAN BERAS'));
    lines.push(line2Cols('No Nota :', s.invoiceNumber));
    lines.push(line2Cols('Tanggal :', formatDateIndo(s.createdAt)));
    lines.push(line2Cols('Pelanggan:', s.customerName || 'Pelanggan Umum'));
    if (s.customerPhone) lines.push(line2Cols('No HP   :', s.customerPhone));
    lines.push(thinDivider);

    s.items.forEach((item) => {
      lines.push(item.productName);
      lines.push(
        line2Cols(
          `  ${item.quantity} x ${formatRupiah(item.pricePerUnit)}`,
          formatRupiah(item.subtotal)
        )
      );
    });

    lines.push(thinDivider);
    lines.push(line2Cols('Subtotal', formatRupiah(s.subtotal)));
    if (s.discount > 0) {
      lines.push(line2Cols('Diskon', `-${formatRupiah(s.discount)}`));
    }
    lines.push(line2Cols('TOTAL AKHIR', formatRupiah(s.finalTotal)));
    lines.push(line2Cols('Metode Bayar', s.paymentMethod.toUpperCase()));
    lines.push(line2Cols('Bayar', formatRupiah(s.paidAmount)));

    if (s.changeAmount > 0) {
      lines.push(line2Cols('Kembalian', formatRupiah(s.changeAmount)));
    }
    if (s.remainingDue > 0) {
      lines.push(line2Cols('Sisa Kasbon', formatRupiah(s.remainingDue)));
      if (s.dueDate) lines.push(line2Cols('Jatuh Tempo', s.dueDate));
    }
  } else if (transaction.type === 'purchase') {
    const p = transaction.data;
    lines.push(center('NOTA TIMBANGAN GABAH'));
    lines.push(line2Cols('No Nota :', p.invoiceNumber));
    lines.push(line2Cols('Tanggal :', formatDateIndo(p.createdAt)));
    lines.push(line2Cols('Petani/Mitra:', p.supplierName));
    lines.push(thinDivider);
    lines.push(p.itemName);
    lines.push(line2Cols(`Bruto (${p.rafaksi.bagCount} karung)`, formatWeight(p.rafaksi.grossWeightKg)));
    lines.push(line2Cols('Tara Karung', `-${formatWeight(p.rafaksi.totalTareKg)}`));
    lines.push(line2Cols(`Rafaksi KA ${p.rafaksi.moisturePercent}%`, `-${formatWeight(p.rafaksi.totalRafaksiKg)}`));
    lines.push(line2Cols('BERAT BERSIH (NETTO)', formatWeight(p.rafaksi.netWeightKg)));
    lines.push(line2Cols('Harga / Kg', formatRupiah(p.pricePerKg)));
    lines.push(thinDivider);
    lines.push(line2Cols('TOTAL PEMBELIAN', formatRupiah(p.totalAmount)));
    lines.push(line2Cols('Dibayarkan', formatRupiah(p.paidAmount)));
    if (p.remainingDebt > 0) {
      lines.push(line2Cols('Sisa Utang Usaha', formatRupiah(p.remainingDebt)));
    }
  } else if (transaction.type === 'milling') {
    const m = transaction.data;
    lines.push(center('NOTA JASA GILING PADI'));
    lines.push(line2Cols('No Nota :', m.invoiceNumber));
    lines.push(line2Cols('Tanggal :', formatDateIndo(m.createdAt)));
    lines.push(line2Cols('Petani  :', m.customerName));
    lines.push(thinDivider);
    lines.push(line2Cols('Gabah Masuk', formatWeight(m.grainWeightKg)));
    lines.push(
      line2Cols(
        'Skema Biaya',
        m.scheme === 'upah_tunai' ? 'Upah Tunai' : m.scheme === 'potong_hasil_dedak' ? 'Bawon Dedak' : 'Potong Beras'
      )
    );
    lines.push(thinDivider);
    lines.push('Hasil Dibawa Petani:');
    lines.push(line2Cols('• Beras Bersih', formatWeight(m.customerTakeRiceKg)));
    lines.push(line2Cols('• Dedak/Katul', formatWeight(m.customerTakeBranKg)));
    lines.push(line2Cols('• Menir', formatWeight(m.customerTakeMenirKg)));

    if (m.deductionBranKg && m.deductionBranKg > 0) {
      lines.push(line2Cols('• Dedak Tinggal di Kilang', formatWeight(m.deductionBranKg)));
    }

    lines.push(thinDivider);
    if (m.scheme === 'upah_tunai') {
      lines.push(line2Cols('Biaya Giling', formatRupiah(m.cashFeeTotal || 0)));
      lines.push(line2Cols('Metode Bayar', (m.paymentMethod || 'Tunai').toUpperCase()));
      lines.push(line2Cols('Status Upah', m.paymentStatus === 'lunas' ? 'LUNAS' : 'KASBON'));
    } else {
      lines.push(line2Cols('Status Biaya', 'LUNAS (SISTEM BAWON)'));
    }
  }

  lines.push(divider);
  if (profile.receiptFooter) lines.push(center(profile.receiptFooter));
  lines.push(center(`Dicetak: ${new Date().toLocaleTimeString('id-ID')}`));
  lines.push('\n\n'); // Feed lines for thermal tear bar

  return lines.join('\n');
}

/**
 * Open RawBT print intent on Android or trigger Bluetooth print share
 */
export function printViaRawBt(text: string) {
  const encoded = encodeURIComponent(text);
  const rawbtUrl = `rawbt:data=${encoded}`;
  
  // Try navigating to rawbt intent
  const intentWindow = window.open(rawbtUrl, '_self');
  if (!intentWindow) {
    // If blocked or not supported, offer Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'Struk Kilang Padi',
        text: text,
      }).catch(() => {
        navigator.clipboard.writeText(text);
      });
    } else {
      navigator.clipboard.writeText(text);
    }
  }
}
