// Utilitário para gerar QR Code visual a partir de código PIX
import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  colorDark?: string;
  colorLight?: string;
}

// Função para gerar QR Code como Data URL (Base64)
export async function generateQRCodeDataURL(text: string, options: QRCodeOptions = {}): Promise<string> {
  const {
    size = 256,
    margin = 4,
    colorDark = '#000000',
    colorLight = '#FFFFFF'
  } = options;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: size,
      margin: margin,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel: 'M',
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Falha ao gerar QR Code: ${error}`);
  }
}

// Função para gerar QR Code como SVG
export async function generateQRCodeSVG(text: string, options: QRCodeOptions = {}): Promise<string> {
  const {
    size = 256,
    margin = 4,
    colorDark = '#000000',
    colorLight = '#FFFFFF'
  } = options;

  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: margin,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel: 'M',
    });
    return svgString;
  } catch (error) {
    throw new Error(`Falha ao gerar SVG QR Code: ${error}`);
  }
}

// Função para gerar QR Code em Canvas
export async function generateQRCodeCanvas(text: string, canvas: HTMLCanvasElement, options: QRCodeOptions = {}): Promise<void> {
  const {
    size = 256,
    margin = 4,
    colorDark = '#000000',
    colorLight = '#FFFFFF'
  } = options;

  try {
    await QRCode.toCanvas(canvas, text, {
      width: size,
      margin: margin,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    throw new Error(`Falha ao gerar Canvas QR Code: ${error}`);
  }
}

// Função para detectar se o código é PIX válido
export function isValidPixCode(code: string): boolean {
  // Códigos PIX começam com "00020126"
  return code.startsWith('00020126') && code.length >= 40;
}

// Função para validar URL do Mercado Pago
export function isMercadoPagoUrl(url: string): boolean {
  return url.includes('mercadopago.com.br') || url.includes('mercadolivre.com');
}

// Função para extrair código PIX de uma string (caso venha junto com outros dados)
export function extractPixCode(input: string): string | null {
  // Se já é um código PIX válido, retorna ele mesmo
  if (isValidPixCode(input)) {
    return input;
  }

  // Procura por um padrão de código PIX na string
  const pixPattern = /00020126[0-9a-zA-Z]+/;
  const match = input.match(pixPattern);
  
  if (match && isValidPixCode(match[0])) {
    return match[0];
  }

  return null;
}
