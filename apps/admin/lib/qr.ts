import QRCode from 'qrcode';

/**
 * Render a QR code for `text` as an inline SVG string (no client JS, no image
 * request). Used for the shareable join / WhatsApp-migration codes.
 */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width: 220,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}
