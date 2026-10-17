/**
 * Indonesian QRIS (Quick Response Code Indonesian Standard) Generator
 * Conforms to Bank Indonesia & ASPI EMVCo specifications.
 */
import QRCode from 'qrcode';

// CRC-16/CCITT-FALSE calculation required for QRIS Tag 63
export function calculateQrisCrc16(payloadWithoutCrc: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payloadWithoutCrc.length; i++) {
    const byte = payloadWithoutCrc.charCodeAt(i);
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export interface QrisGenerateParams {
  nmid: string;
  merchantName: string;
  amount?: number;
  invoiceNumber?: string;
  city?: string;
  postalCode?: string;
}

/**
 * Builds standard Indonesian QRIS EMVCo string payload
 */
export function buildQrisPayload({
  nmid,
  merchantName,
  amount,
  invoiceNumber,
  city = 'JAWA TENGAH',
  postalCode = '57211',
}: QrisGenerateParams): string {
  const cleanNmid = (nmid || 'ID1024356789123').trim();
  // Sanitize merchant name: max 25 chars alphanumeric and spaces
  const cleanMerchant = (merchantName || 'SUMBER MAKMUR RICE MILL')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, 25);

  const cleanCity = city.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 15);
  const isDynamic = typeof amount === 'number' && amount > 0;

  // 00: Format Indicator
  let payload = formatTlv('00', '01');
  // 01: Initiation method: 11 for static, 12 for dynamic
  payload += formatTlv('01', isDynamic ? '12' : '11');

  // Tag 26: Merchant Account Information
  const tag26_00 = formatTlv('00', 'ID.LINKAJA.WWW');
  const tag26_01 = formatTlv('01', '936009110024356789');
  const tag26_02 = formatTlv('02', cleanNmid);
  const tag26_03 = formatTlv('03', 'UMI');
  payload += formatTlv('26', `${tag26_00}${tag26_01}${tag26_02}${tag26_03}`);

  // Tag 51: National QRIS standard
  const tag51_00 = formatTlv('00', 'ID.CO.QRIS.WWW');
  const tag51_02 = formatTlv('02', cleanNmid);
  const tag51_03 = formatTlv('03', 'UMI');
  payload += formatTlv('51', `${tag51_00}${tag51_02}${tag51_03}`);

  // Tag 52: Merchant Category Code (5499: Miscellaneous Food Stores - Agricultural/Rice Mill)
  payload += formatTlv('52', '5499');
  // Tag 53: Transaction Currency (360 = IDR)
  payload += formatTlv('53', '360');

  // Tag 54: Transaction Amount (if dynamic)
  if (isDynamic && amount && amount > 0) {
    payload += formatTlv('54', Math.round(amount).toString());
  }

  // Tag 58: Country Code
  payload += formatTlv('58', 'ID');
  // Tag 59: Merchant Name
  payload += formatTlv('59', cleanMerchant);
  // Tag 60: Merchant City
  payload += formatTlv('60', cleanCity);
  // Tag 61: Postal Code
  payload += formatTlv('61', postalCode);

  // Tag 62: Additional Data Field (Invoice / Reference)
  if (invoiceNumber) {
    const cleanRef = invoiceNumber.replace(/[^A-Z0-9-]/gi, '').slice(0, 20);
    const tag62_01 = formatTlv('01', cleanRef);
    payload += formatTlv('62', tag62_01);
  }

  // Tag 63: CRC16 Checksum
  const payloadToSign = `${payload}6304`;
  const checksum = calculateQrisCrc16(payloadToSign);

  return `${payloadToSign}${checksum}`;
}

/**
 * Render QR Code onto a canvas
 */
export async function renderQrisToCanvas(
  canvas: HTMLCanvasElement,
  payloadText: string,
  size: number = 260
): Promise<void> {
  await QRCode.toCanvas(canvas, payloadText, {
    width: size,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate QR Code as Data URL
 */
export async function getQrisDataUrl(payloadText: string, size: number = 300): Promise<string> {
  return QRCode.toDataURL(payloadText, {
    width: size,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}
