'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
  HistoryOutlined,
  QrcodeOutlined,
  PhoneOutlined,
  MailOutlined,
  WifiOutlined,
  ContactsOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

// ─── Pure QR Code implementation ────────────────────────────────────────────
// Implements QR code version 1-10 with error correction levels L/M/Q/H
// Uses Reed-Solomon error correction and standard QR encoding

// GF(256) arithmetic for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function gfPoly(degree: number): Uint8Array {
  let p = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const np = new Uint8Array(p.length + 1);
    for (let j = 0; j < p.length; j++) {
      np[j] ^= gfMul(p[j], GF_EXP[i]);
      np[j + 1] ^= p[j];
    }
    p = np;
  }
  return p;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = gfPoly(ecCount);
  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// QR Code version capacity tables [version-1][ecLevel: L,M,Q,H]
// dataCapacityBytes
const DATA_CAPACITY: number[][] = [
  [19, 16, 13, 9],   // version 1
  [34, 28, 22, 16],  // version 2
  [55, 44, 34, 26],  // version 3
  [80, 64, 48, 36],  // version 4
  [108, 86, 62, 46], // version 5
  [136, 108, 76, 60],// version 6
  [156, 124, 88, 66],// version 7
  [194, 154, 110, 86],// version 8
  [232, 182, 132, 100],// version 9
  [274, 216, 154, 122],// version 10
];

// EC codewords per block [version-1][ecLevel: L,M,Q,H]
const EC_CODEWORDS: number[][] = [
  [7, 10, 13, 17],
  [10, 16, 22, 28],
  [15, 26, 18, 22],
  [20, 18, 26, 16],
  [26, 24, 18, 22],
  [18, 16, 24, 28],
  [20, 18, 18, 26],
  [24, 22, 22, 26],
  [30, 22, 20, 24],
  [18, 26, 24, 28],
];

// Number of blocks [version-1][ecLevel: L,M,Q,H]
const NUM_BLOCKS: number[][] = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 4, 4],
  [2, 4, 4, 4],
  [2, 4, 6, 5],
  [2, 4, 6, 6],
  [2, 5, 8, 8],
  [4, 5, 8, 8],
];

type ECLevel = 'L' | 'M' | 'Q' | 'H';

const EC_IDX: Record<ECLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
const EC_INDICATOR: Record<ECLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

function getVersion(dataLen: number, ecLevel: ECLevel): number {
  const idx = EC_IDX[ecLevel];
  for (let v = 0; v < DATA_CAPACITY.length; v++) {
    if (DATA_CAPACITY[v][idx] >= dataLen) return v + 1;
  }
  return -1; // too long
}

function getModuleCount(version: number): number {
  return version * 4 + 17;
}

// Encode data as byte mode
function encodeData(text: string, version: number, ecLevel: ECLevel): Uint8Array {
  const idx = EC_IDX[ecLevel];
  const totalCodewords = DATA_CAPACITY[version - 1][idx];
  const bytes = new TextEncoder().encode(text);
  const dataLen = bytes.length;

  // Build bitstream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode indicator: byte = 0100
  pushBits(0b0100, 4);

  // Character count (8 bits for version 1-9)
  const ccLen = version <= 9 ? 8 : 16;
  pushBits(dataLen, ccLen);

  // Data bytes
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeros)
  const maxBits = totalCodewords * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Add pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx++ % 2], 8);
  }

  // Convert bits to bytes
  const result = new Uint8Array(bits.length / 8);
  for (let i = 0; i < result.length; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    result[i] = b;
  }
  return result;
}

// Generate full codeword sequence with interleaving
function buildCodewords(dataCodewords: Uint8Array, version: number, ecLevel: ECLevel): Uint8Array {
  const idx = EC_IDX[ecLevel];
  const numBlocks = NUM_BLOCKS[version - 1][idx];
  const ecPerBlock = EC_CODEWORDS[version - 1][idx];
  const totalData = DATA_CAPACITY[version - 1][idx];

  const blockSize = Math.floor(totalData / numBlocks);
  const extraBlocks = totalData % numBlocks;

  // Split data into blocks
  const blocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const size = b < numBlocks - extraBlocks ? blockSize : blockSize + 1;
    blocks.push(dataCodewords.slice(offset, offset + size));
    offset += size;
  }

  // Generate EC for each block
  const ecBlocks = blocks.map((bl) => rsEncode(bl, ecPerBlock));

  // Interleave data
  const maxDataBlock = blocks.reduce((m, b) => Math.max(m, b.length), 0);
  const maxECBlock = ecBlocks[0].length;
  const result: number[] = [];

  for (let i = 0; i < maxDataBlock; i++) {
    for (const block of blocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  for (let i = 0; i < maxECBlock; i++) {
    for (const ec of ecBlocks) {
      if (i < ec.length) result.push(ec[i]);
    }
  }
  return new Uint8Array(result);
}

// Matrix operations
class QRMatrix {
  size: number;
  modules: (number | null)[][];
  isFunction: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array(size).fill(null));
    this.isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
  }

  set(r: number, c: number, dark: boolean, isFunc = false) {
    this.modules[r][c] = dark ? 1 : 0;
    if (isFunc) this.isFunction[r][c] = true;
  }

  get(r: number, c: number): number {
    return this.modules[r][c] ?? 0;
  }
}

function placeFinderPattern(matrix: QRMatrix, row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const tr = row + r;
      const tc = col + c;
      if (tr < 0 || tr >= matrix.size || tc < 0 || tc >= matrix.size) continue;
      const dark =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      matrix.set(tr, tc, dark, true);
    }
  }
}

function placeAlignmentPattern(matrix: QRMatrix, row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const dark =
        Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      matrix.set(row + r, col + c, dark, true);
    }
  }
}

// Alignment pattern positions for versions 1-10
const ALIGNMENT_POSITIONS: number[][] = [
  [],           // v1
  [6, 18],      // v2
  [6, 22],      // v3
  [6, 26],      // v4
  [6, 30],      // v5
  [6, 34],      // v6
  [6, 22, 38],  // v7
  [6, 24, 42],  // v8
  [6, 26, 46],  // v9
  [6, 28, 50],  // v10
];

function buildMatrix(version: number, ecLevel: ECLevel, codewords: Uint8Array): { matrix: QRMatrix; mask: number } {
  const size = getModuleCount(version);
  const matrix = new QRMatrix(size);

  // Finder patterns
  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, 0, size - 7);
  placeFinderPattern(matrix, size - 7, 0);

  // Separators (already covered by finder function marking)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix.set(6, i, i % 2 === 0, true);
    matrix.set(i, 6, i % 2 === 0, true);
  }

  // Dark module
  matrix.set(size - 8, 8, true, true);

  // Alignment patterns
  const positions = ALIGNMENT_POSITIONS[version - 1];
  if (positions.length >= 2) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const r = positions[i];
        const c = positions[j];
        // Skip if overlaps with finder patterns
        if ((i === 0 && j === 0) || (i === 0 && j === positions.length - 1) || (i === positions.length - 1 && j === 0)) continue;
        placeAlignmentPattern(matrix, r, c);
      }
    }
  }

  // Format info placeholders
  for (let i = 0; i <= 8; i++) {
    if (!matrix.isFunction[6][i]) matrix.set(6, i, false, true);
    if (!matrix.isFunction[i][6]) matrix.set(i, 6, false, true);
    if (i < 8) {
      matrix.set(size - 1 - i, 8, false, true);
      matrix.set(8, size - 1 - i, false, true);
    }
    matrix.set(i, 8, false, true);
    matrix.set(8, i, false, true);
  }

  // Place data bits
  placeDataBits(matrix, codewords);

  // Choose best mask
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(matrix, mask);
    placeFormatInfo(matrix, ecLevel, mask);
    const penalty = calcPenalty(matrix);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    applyMask(matrix, mask); // unapply
  }

  applyMask(matrix, bestMask);
  placeFormatInfo(matrix, ecLevel, bestMask);

  return { matrix, mask: bestMask };
}

function placeDataBits(matrix: QRMatrix, codewords: Uint8Array) {
  let bitIdx = 0;
  const size = matrix.size;

  // Zigzag column pairs from right to left, skipping timing column 6
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const row = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        if (!matrix.isFunction[row][col]) {
          const byteIdx = Math.floor(bitIdx / 8);
          const bitPos = 7 - (bitIdx % 8);
          const dark = byteIdx < codewords.length ? (codewords[byteIdx] >> bitPos) & 1 : 0;
          matrix.modules[row][col] = dark;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix: QRMatrix, mask: number) {
  const size = matrix.size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix.isFunction[r][c]) continue;
      const shouldInvert =
        mask === 0 ? (r + c) % 2 === 0 :
        mask === 1 ? r % 2 === 0 :
        mask === 2 ? c % 3 === 0 :
        mask === 3 ? (r + c) % 3 === 0 :
        mask === 4 ? (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0 :
        mask === 5 ? ((r * c) % 2 + (r * c) % 3) === 0 :
        mask === 6 ? ((r * c) % 2 + (r * c) % 3) % 2 === 0 :
        ((r + c) % 2 + (r * c) % 3) % 2 === 0;

      if (shouldInvert) matrix.modules[r][c] = matrix.modules[r][c] === 1 ? 0 : 1;
    }
  }
}

function placeFormatInfo(matrix: QRMatrix, ecLevel: ECLevel, mask: number) {
  const size = matrix.size;
  const ecBits = EC_INDICATOR[ecLevel];
  const data = (ecBits << 3) | mask;

  // BCH error correction for format info
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  }
  const format = ((data << 10) | rem) ^ 0x5412;

  const bits: number[] = [];
  for (let i = 0; i < 15; i++) {
    bits.push((format >> i) & 1);
  }

  // Place around top-left finder
  const placements: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    matrix.set(placements[i][0], placements[i][1], bits[i] === 1, true);
  }

  // Place near other finders
  for (let i = 0; i < 8; i++) {
    matrix.set(size - 1 - i, 8, bits[i] === 1, true);
  }
  for (let i = 8; i < 15; i++) {
    matrix.set(8, size - 15 + i, bits[i] === 1, true);
  }
}

function calcPenalty(matrix: QRMatrix): number {
  const size = matrix.size;
  let penalty = 0;

  // Rule 1: 5+ in a row/col
  for (let r = 0; r < size; r++) {
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (matrix.modules[r][c] === matrix.modules[r][c - 1]) {
        runLen++;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else runLen = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (matrix.modules[r][c] === matrix.modules[r - 1][c]) {
        runLen++;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else runLen = 1;
    }
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix.modules[r][c];
      if (v === matrix.modules[r + 1][c] && v === matrix.modules[r][c + 1] && v === matrix.modules[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }

  // Rule 4: balance
  let dark = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (matrix.modules[r][c] === 1) dark++;
  const total = size * size;
  const pct = (dark / total) * 100;
  const k = Math.floor(Math.abs(pct - 50) / 5);
  penalty += k * 10;

  return penalty;
}

// ─── Main QR generation entry point ────────────────────────────────────────

function generateQR(text: string, ecLevel: ECLevel): { matrix: QRMatrix; version: number } | null {
  const bytes = new TextEncoder().encode(text);
  const version = getVersion(bytes.length + 4, ecLevel); // +4 for mode + char count
  if (version < 0) return null;

  const dataCodewords = encodeData(text, version, ecLevel);
  const codewords = buildCodewords(dataCodewords, version, ecLevel);
  const { matrix } = buildMatrix(version, ecLevel, codewords);
  return { matrix, version };
}

// ─── Canvas renderer ─────────────────────────────────────────────────────────

function renderQR(
  canvas: HTMLCanvasElement,
  matrix: QRMatrix,
  size: number,
  fgColor: string,
  bgColor: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  const moduleSize = size / matrix.size;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = fgColor;
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (matrix.modules[r][c] === 1) {
        ctx.fillRect(
          c * moduleSize,
          r * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentType = 'text' | 'phone' | 'email' | 'wifi' | 'vcard';
type QrSize = 128 | 256 | 512 | 1024;

interface QRHistoryItem {
  id: number;
  content: string;
  type: ContentType;
  dataUrl: string;
  timestamp: number;
}

interface WifiData {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

// ─── Content builders ─────────────────────────────────────────────────────

function buildQRContent(type: ContentType, data: {
  text: string;
  phone: string;
  emailData: EmailData;
  wifiData: WifiData;
  vcard: VCardData;
}): string {
  switch (type) {
    case 'text': return data.text;
    case 'phone': return `tel:${data.phone}`;
    case 'email': {
      const { to, subject, body } = data.emailData;
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
    }
    case 'wifi': {
      const { ssid, password, security, hidden } = data.wifiData;
      return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
    }
    case 'vcard': {
      const { firstName, lastName, phone, email, org, url } = data.vcard;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${firstName} ${lastName}`,
        phone ? `TEL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        org ? `ORG:${org}` : '',
        url ? `URL:${url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    }
    default: return '';
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function QrGeneratorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeType, setActiveType] = useState<ContentType>('text');
  const [textInput, setTextInput] = useState('https://example.com');
  const [phoneInput, setPhoneInput] = useState('+84');
  const [emailData, setEmailData] = useState<EmailData>({ to: '', subject: '', body: '' });
  const [wifiData, setWifiData] = useState<WifiData>({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [vcardData, setVCardData] = useState<VCardData>({ firstName: '', lastName: '', phone: '', email: '', org: '', url: '' });

  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecLevel, setEcLevel] = useState<ECLevel>('M');
  const [qrSize, setQrSize] = useState<QrSize>(256);

  const [currentMatrix, setCurrentMatrix] = useState<QRMatrix | null>(null);
  const [qrVersion, setQrVersion] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [historyCounter, setHistoryCounter] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // ─── Theme tokens ─────────────────────────────────────────────────────────
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const sectionBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    fontSize: 14,
    color: textColor,
    outline: 'none',
    boxSizing: 'border-box',
    colorScheme: isDark ? 'dark' : 'light',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: subColor,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const getContent = useCallback((): string => {
    return buildQRContent(activeType, {
      text: textInput,
      phone: phoneInput,
      emailData,
      wifiData,
      vcard: vcardData,
    });
  }, [activeType, textInput, phoneInput, emailData, wifiData, vcardData]);

  const generateAndRender = useCallback(() => {
    const content = getContent();
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung');
      setCurrentMatrix(null);
      return;
    }

    const result = generateQR(content, ecLevel);
    if (!result) {
      setError('Nội dung quá dài. Vui lòng rút ngắn.');
      setCurrentMatrix(null);
      return;
    }

    setError('');
    setCurrentMatrix(result.matrix);
    setQrVersion(result.version);

    // Render to canvas
    requestAnimationFrame(() => {
      if (canvasRef.current) {
        renderQR(canvasRef.current, result.matrix, qrSize, fgColor, bgColor);
      }
    });
  }, [getContent, ecLevel, qrSize, fgColor, bgColor]);

  // Re-render when colors/size change and matrix exists
  useEffect(() => {
    if (currentMatrix && canvasRef.current) {
      renderQR(canvasRef.current, currentMatrix, qrSize, fgColor, bgColor);
    }
  }, [currentMatrix, qrSize, fgColor, bgColor]);

  // Initial generation
  useEffect(() => {
    generateAndRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToHistory = useCallback(() => {
    if (!canvasRef.current || !currentMatrix) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const item: QRHistoryItem = {
      id: historyCounter,
      content: getContent(),
      type: activeType,
      dataUrl,
      timestamp: Date.now(),
    };
    setHistory((prev) => [item, ...prev].slice(0, 10));
    setHistoryCounter((c) => c + 1);
    message.success('Đã lưu vào lịch sử!');
  }, [currentMatrix, getContent, activeType, historyCounter]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
    message.success('Đã tải về!');
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        message.success('Đã sao chép ảnh QR!');
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback: copy data URL as text
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await navigator.clipboard.writeText(dataUrl);
      message.info('Đã sao chép data URL');
    }
  }, []);

  const TABS: { id: ContentType; icon: React.ReactNode; label: string }[] = [
    { id: 'text', icon: <QrcodeOutlined />, label: 'Text/URL' },
    { id: 'phone', icon: <PhoneOutlined />, label: 'Điện thoại' },
    { id: 'email', icon: <MailOutlined />, label: 'Email' },
    { id: 'wifi', icon: <WifiOutlined />, label: 'WiFi' },
    { id: 'vcard', icon: <ContactsOutlined />, label: 'vCard' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Left: Settings ── */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Content type tabs */}
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    padding: '8px 10px',
                    background: activeType === tab.id ? 'rgba(80,200,120,0.12)' : inputBg,
                    border: activeType === tab.id ? '1.5px solid #50C87866' : `1px solid ${inputBorder}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 16, color: activeType === tab.id ? '#50C878' : subColor }}>
                    {tab.icon}
                  </span>
                  <span style={{ fontSize: 11, color: activeType === tab.id ? '#50C878' : textColor, fontWeight: activeType === tab.id ? 700 : 400 }}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Content form by type */}
            {activeType === 'text' && (
              <div>
                <label style={labelStyle}>Văn bản / URL</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={3}
                  placeholder="https://example.com hoặc văn bản bất kỳ"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}

            {activeType === 'phone' && (
              <div>
                <label style={labelStyle}>Số điện thoại</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+84901234567"
                  style={inputStyle}
                />
              </div>
            )}

            {activeType === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Địa chỉ Email</label>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    placeholder="example@email.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tiêu đề</label>
                  <input
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Tiêu đề email"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nội dung</label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    rows={2}
                    placeholder="Nội dung email..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {activeType === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Tên mạng (SSID)</label>
                  <input
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    placeholder="Tên WiFi"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mật khẩu</label>
                  <input
                    type="password"
                    value={wifiData.password}
                    onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                    placeholder="Mật khẩu WiFi"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bảo mật</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['WPA', 'WEP', 'nopass'] as const).map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setWifiData({ ...wifiData, security: sec })}
                        style={{
                          flex: 1,
                          padding: '7px',
                          background: wifiData.security === sec ? 'rgba(80,200,120,0.12)' : inputBg,
                          border: wifiData.security === sec ? '1.5px solid #50C87866' : `1px solid ${inputBorder}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: wifiData.security === sec ? 700 : 400,
                          color: wifiData.security === sec ? '#50C878' : textColor,
                        }}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: textColor, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={wifiData.hidden}
                    onChange={(e) => setWifiData({ ...wifiData, hidden: e.target.checked })}
                  />
                  Mạng ẩn (Hidden network)
                </label>
              </div>
            )}

            {activeType === 'vcard' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'firstName', label: 'Tên', placeholder: 'Văn A' },
                  { key: 'lastName', label: 'Họ', placeholder: 'Nguyễn' },
                  { key: 'phone', label: 'Điện thoại', placeholder: '+84...' },
                  { key: 'email', label: 'Email', placeholder: 'example@email.com' },
                  { key: 'org', label: 'Tổ chức', placeholder: 'Công ty...' },
                  { key: 'url', label: 'Website', placeholder: 'https://...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      value={vcardData[key as keyof VCardData]}
                      onChange={(e) => setVCardData({ ...vcardData, [key]: e.target.value })}
                      placeholder={placeholder}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customization */}
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px 18px 14px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: textColor }}>
              Tùy chỉnh
            </h3>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Màu QR</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }}
                  />
                  <input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                    maxLength={7}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Màu nền</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }}
                  />
                  <input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* EC Level */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Mức sửa lỗi (Error Correction)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['L', 'M', 'Q', 'H'] as ECLevel[]).map((level) => {
                  const desc = { L: 'Thấp 7%', M: 'Vừa 15%', Q: 'Cao 25%', H: 'Rất cao 30%' }[level];
                  return (
                    <button
                      key={level}
                      onClick={() => setEcLevel(level)}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        background: ecLevel === level ? 'rgba(80,200,120,0.12)' : inputBg,
                        border: ecLevel === level ? '1.5px solid #50C87866' : `1px solid ${inputBorder}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: ecLevel === level ? '#50C878' : textColor }}>
                        {level}
                      </div>
                      <div style={{ fontSize: 9, color: subColor, marginTop: 2 }}>{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size */}
            <div>
              <label style={labelStyle}>Kích thước xuất</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([128, 256, 512, 1024] as QrSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setQrSize(s)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      background: qrSize === s ? 'rgba(80,200,120,0.12)' : inputBg,
                      border: qrSize === s ? '1.5px solid #50C87866' : `1px solid ${inputBorder}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: qrSize === s ? 700 : 400,
                      color: qrSize === s ? '#50C878' : textColor,
                    }}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: QR Preview ── */}
        <div style={{ flex: '0 0 320px', minWidth: 260 }}>
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 14,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Xem trước QR</span>
              {qrVersion > 0 && (
                <span style={{ fontSize: 11, color: subColor }}>
                  Version {qrVersion} · {ecLevel}
                </span>
              )}
            </div>

            {/* Canvas */}
            <div
              style={{
                width: 300,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: error ? (isDark ? '#2a1a1a' : '#fff5f5') : 'transparent',
                borderRadius: 8,
                border: error ? '1px solid #ef444444' : 'none',
                overflow: 'hidden',
              }}
            >
              {error ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <QrcodeOutlined style={{ fontSize: 48, color: isDark ? '#444' : '#ccc' }} />
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: '#ef4444' }}>{error}</p>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  style={{
                    width: 300,
                    height: 300,
                    imageRendering: 'pixelated',
                    borderRadius: 4,
                  }}
                />
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={generateAndRender}
              style={{
                width: '100%',
                padding: '11px',
                background: 'rgba(80,200,120,0.12)',
                border: '1.5px solid #50C87866',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: '#50C878',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ReloadOutlined />
              Tạo mã QR
            </button>

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%' }}>
              <button
                onClick={handleDownload}
                disabled={!!error || !currentMatrix}
                style={{
                  padding: '9px 8px',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: 8,
                  cursor: !error && currentMatrix ? 'pointer' : 'not-allowed',
                  opacity: !error && currentMatrix ? 1 : 0.5,
                  fontSize: 12,
                  color: textColor,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <DownloadOutlined style={{ fontSize: 16 }} />
                <span>Tải PNG</span>
              </button>
              <button
                onClick={handleCopyToClipboard}
                disabled={!!error || !currentMatrix}
                style={{
                  padding: '9px 8px',
                  background: copied ? 'rgba(80,200,120,0.1)' : inputBg,
                  border: `1px solid ${copied ? '#50C87866' : inputBorder}`,
                  borderRadius: 8,
                  cursor: !error && currentMatrix ? 'pointer' : 'not-allowed',
                  opacity: !error && currentMatrix ? 1 : 0.5,
                  fontSize: 12,
                  color: copied ? '#50C878' : textColor,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                {copied ? <CheckOutlined style={{ fontSize: 16 }} /> : <CopyOutlined style={{ fontSize: 16 }} />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
              <button
                onClick={handleSaveToHistory}
                disabled={!!error || !currentMatrix}
                style={{
                  padding: '9px 8px',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: 8,
                  cursor: !error && currentMatrix ? 'pointer' : 'not-allowed',
                  opacity: !error && currentMatrix ? 1 : 0.5,
                  fontSize: 12,
                  color: textColor,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <HistoryOutlined style={{ fontSize: 16 }} />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR History ── */}
      <div
        style={{
          marginTop: 24,
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setShowHistory((v) => !v)}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ fontSize: 16, color: '#50C878' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
              Lịch sử QR ({history.length}/10)
            </span>
          </div>
          <span style={{ fontSize: 12, color: subColor }}>{showHistory ? 'Thu gọn ▲' : 'Mở rộng ▼'}</span>
        </button>

        {showHistory && (
          <div style={{ padding: '0 20px 16px' }}>
            {history.length === 0 ? (
              <p style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                Chưa có QR nào được lưu. Nhấn "Lưu" sau khi tạo QR.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    onClick={() => setHistory([])}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: subColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <DeleteOutlined />
                    Xóa lịch sử
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 12,
                  }}
                >
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: sectionBg,
                        border: `1px solid ${inputBorder}`,
                        borderRadius: 8,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <img
                        src={item.dataUrl}
                        alt="QR"
                        style={{
                          width: 80,
                          height: 80,
                          imageRendering: 'pixelated',
                          borderRadius: 4,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 10,
                          color: subColor,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                      >
                        {item.content.slice(0, 20)}{item.content.length > 20 ? '...' : ''}
                      </div>
                      <div style={{ fontSize: 9, color: subColor }}>
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                      </div>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = item.dataUrl;
                          a.download = `qr-${item.id}.png`;
                          a.click();
                        }}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${inputBorder}`,
                          borderRadius: 4,
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: 10,
                          color: subColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <DownloadOutlined />
                        Tải
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
