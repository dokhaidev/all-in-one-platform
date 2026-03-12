'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Radio, Checkbox, Select, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  SwapOutlined,
  CopyOutlined,
  DownloadOutlined,
  TableOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function detectDelimiter(line: string): string {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  for (const d of candidates) {
    const count = line.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseOneLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (line.slice(i, i + delimiter.length) === delimiter) {
        fields.push(current);
        current = '';
        i += delimiter.length;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(
  text: string,
  delimiterChoice: string,
  hasHeader: boolean,
): { headers: string[]; rows: string[][]; error?: string } {
  if (!text.trim()) {
    return { headers: [], rows: [], error: 'Dữ liệu trống.' };
  }

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], error: 'Không có dòng dữ liệu.' };
  }

  const delimiter =
    delimiterChoice === 'auto' ? detectDelimiter(lines[0]) : delimiterChoice;

  const parsed = lines.map((l) => parseOneLine(l, delimiter));

  if (hasHeader) {
    const headers = parsed[0];
    const rows = parsed.slice(1);
    return { headers, rows };
  } else {
    const colCount = Math.max(...parsed.map((r) => r.length));
    const headers = Array.from({ length: colCount }, (_, i) => `Cột ${i + 1}`);
    return { headers, rows: parsed };
  }
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function exportToExcel(
  headers: string[],
  rows: string[][],
  filename: string,
) {
  const xmlRows = [headers, ...rows]
    .map(
      (row) =>
        '<Row>' +
        row
          .map(
            (cell) =>
              `<Cell><Data ss:Type="String">${escapeXml(cell ?? '')}</Data></Cell>`,
          )
          .join('') +
        '</Row>',
    )
    .join('');
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, filename);
}

function exportToJson(
  headers: string[],
  rows: string[][],
  filename: string,
) {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, filename);
}

function exportToCsv(
  headers: string[],
  rows: string[][],
  filename: string,
) {
  const escCsv = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [
    headers.map(escCsv).join(','),
    ...rows.map((r) => r.map(escCsv).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

// ─── Component ────────────────────────────────────────────────────────────────

type InputMode = 'upload' | 'paste';
type ViewTab = 'table' | 'json';
type DelimiterOption = 'auto' | ',' | ';' | '\t' | '|';

interface ParsedResult {
  headers: string[];
  rows: string[][];
  sizeKb: number;
  filename: string;
}

const SAMPLE_CSV = `tên,tuổi,thành phố,nghề nghiệp
Nguyễn Văn A,28,Hà Nội,Kỹ sư
Trần Thị B,32,TP.HCM,Bác sĩ
Lê Văn C,25,Đà Nẵng,Giáo viên
Phạm Thị D,35,Cần Thơ,Kế toán`;

const PREVIEW_LIMIT = 100;

export default function CsvConverterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const inputBg = isDark ? '#141414' : '#f9fafb';
  const inputColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const metaTextColor = isDark ? '#888' : '#999';
  const dropZoneBg = isDark ? '#141414' : '#f7f9fc';
  const dropZoneBorder = isDark ? '#333' : '#d9d9d9';
  const dropZoneHoverBorder = PRIMARY;
  const codeBg = isDark ? '#111' : '#f6f8fa';
  const codeColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const statsBg = isDark ? '#171717' : '#f0f0f0';

  // ── State ───────────────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [pasteText, setPasteText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [delimiter, setDelimiter] = useState<DelimiterOption>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>('table');
  const [converting, setConverting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File reading ─────────────────────────────────────────────────────────────
  const readFileText = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        if (file.size > 10 * 1024 * 1024) {
          reject(
            new Error(
              'File quá lớn (> 10MB). Vui lòng dùng file nhỏ hơn.',
            ),
          );
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) ?? '');
        reader.onerror = () => reject(new Error('Không thể đọc file.'));
        reader.readAsText(file, 'utf-8');
      }),
    [],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const allowed = ['.csv', '.txt', 'text/csv', 'text/plain'];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext) && !allowed.includes(file.type)) {
        setError('Chỉ chấp nhận file .csv hoặc .txt.');
        return;
      }
      try {
        const text = await readFileText(file);
        setUploadedFile(file);
        setUploadedText(text);
        setError(null);
        setResult(null);
      } catch (err: unknown) {
        setError((err as Error).message);
      }
    },
    [readFileText],
  );

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ── Convert ──────────────────────────────────────────────────────────────────
  const handleConvert = useCallback(() => {
    setConverting(true);
    setError(null);

    const rawText =
      inputMode === 'upload' ? uploadedText : pasteText;

    if (!rawText.trim()) {
      setError(
        inputMode === 'upload'
          ? 'Vui lòng tải lên một file CSV.'
          : 'Vui lòng dán dữ liệu CSV vào ô trên.',
      );
      setConverting(false);
      return;
    }

    const { headers, rows, error: parseError } = parseCsv(
      rawText,
      delimiter,
      hasHeader,
    );

    if (parseError || headers.length === 0) {
      setError(parseError ?? 'Không thể phân tích CSV.');
      setConverting(false);
      return;
    }

    const sizeKb = new Blob([rawText]).size / 1024;
    const filename =
      inputMode === 'upload' && uploadedFile
        ? uploadedFile.name.replace(/\.(csv|txt)$/i, '')
        : 'data';

    setResult({ headers, rows, sizeKb, filename });
    setViewTab('table');
    setConverting(false);
  }, [inputMode, uploadedText, pasteText, delimiter, hasHeader, uploadedFile]);

  // ── JSON string ──────────────────────────────────────────────────────────────
  const jsonString = result
    ? JSON.stringify(
        result.rows.map((row) => {
          const obj: Record<string, string> = {};
          result.headers.forEach((h, i) => {
            obj[h] = row[i] ?? '';
          });
          return obj;
        }),
        null,
        2,
      )
    : '';

  // ── Table columns + data ────────────────────────────────────────────────────
  const tableColumns: ColumnsType<Record<string, string>> = result
    ? result.headers.map((h, i) => ({
        title: (
          <span style={{ color: sectionHeaderColor, fontWeight: 600 }}>
            {h}
          </span>
        ),
        dataIndex: `col_${i}`,
        key: `col_${i}`,
        ellipsis: true,
        render: (v: string) => (
          <span style={{ color: isDark ? '#c9c9c9' : '#333', fontSize: 13 }}>
            {v}
          </span>
        ),
      }))
    : [];

  const previewRows = result ? result.rows.slice(0, PREVIEW_LIMIT) : [];
  const tableData: Record<string, string>[] = previewRows.map((row, ri) => {
    const obj: Record<string, string> = { key: String(ri) };
    result?.headers.forEach((_, i) => {
      obj[`col_${i}`] = row[i] ?? '';
    });
    return obj;
  });

  // ── Shared styles ────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: panelBg,
    border: `1px solid ${panelBorder}`,
    borderRadius: 12,
    padding: '20px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: sectionHeaderColor,
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 180,
    resize: 'vertical',
    background: inputBg,
    color: inputColor,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.7,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {contextHolder}

      {/* ── Section 1: Input ── */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudUploadOutlined style={{ fontSize: 16, color: PRIMARY }} />
          <span style={sectionTitleStyle}>Dữ liệu đầu vào</span>
        </div>

        {/* Mode switcher */}
        <Radio.Group
          value={inputMode}
          onChange={(e) => {
            setInputMode(e.target.value);
            setError(null);
            setResult(null);
          }}
          buttonStyle="solid"
          style={{ display: 'flex' }}
        >
          <Radio.Button
            value="upload"
            style={{
              flex: 1,
              textAlign: 'center',
              background:
                inputMode === 'upload'
                  ? PRIMARY
                  : isDark
                  ? '#1a1a1a'
                  : '#f5f5f5',
              borderColor:
                inputMode === 'upload' ? PRIMARY : isDark ? '#333' : '#d9d9d9',
              color:
                inputMode === 'upload'
                  ? '#fff'
                  : isDark
                  ? '#aaa'
                  : '#555',
            }}
          >
            Tải File Lên
          </Radio.Button>
          <Radio.Button
            value="paste"
            style={{
              flex: 1,
              textAlign: 'center',
              background:
                inputMode === 'paste'
                  ? PRIMARY
                  : isDark
                  ? '#1a1a1a'
                  : '#f5f5f5',
              borderColor:
                inputMode === 'paste' ? PRIMARY : isDark ? '#333' : '#d9d9d9',
              color:
                inputMode === 'paste'
                  ? '#fff'
                  : isDark
                  ? '#aaa'
                  : '#555',
            }}
          >
            Dán Dữ Liệu
          </Radio.Button>
        </Radio.Group>

        {/* Upload zone */}
        {inputMode === 'upload' && (
          <div>
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? dropZoneHoverBorder : dropZoneBorder}`,
                  borderRadius: 10,
                  padding: '36px 24px',
                  background: isDragging ? PRIMARY_BG : dropZoneBg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <CloudUploadOutlined
                  style={{
                    fontSize: 40,
                    color: isDragging ? PRIMARY : isDark ? '#555' : '#bbb',
                  }}
                />
                <span style={{ color: isDark ? '#aaa' : '#666', fontSize: 14, textAlign: 'center' }}>
                  Kéo thả file vào đây hoặc nhấn để chọn
                </span>
                <span style={{ color: metaTextColor, fontSize: 12 }}>
                  Hỗ trợ: .csv, .txt · Tối đa 10MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  border: `1px solid ${PRIMARY_BORDER}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  background: PRIMARY_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileTextOutlined style={{ fontSize: 22, color: PRIMARY }} />
                  <div>
                    <div style={{ color: sectionHeaderColor, fontWeight: 600, fontSize: 14 }}>
                      {uploadedFile.name}
                    </div>
                    <div style={{ color: metaTextColor, fontSize: 12 }}>
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedText('');
                    setResult(null);
                    setError(null);
                  }}
                >
                  Xóa
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Paste zone */}
        {inputMode === 'paste' && (
          <textarea
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder={SAMPLE_CSV}
            style={textareaStyle}
            spellCheck={false}
          />
        )}

        {/* Options row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <Checkbox
            checked={hasHeader}
            onChange={(e) => {
              setHasHeader(e.target.checked);
              setResult(null);
            }}
            style={{ color: isDark ? '#c9c9c9' : '#333', fontSize: 14 }}
          >
            Dùng dòng đầu tiên làm header
          </Checkbox>
          <span style={{ color: metaTextColor, fontSize: 12 }}>
            (Dòng đầu tiên sẽ là tên cột trong kết quả)
          </span>
        </div>

        {/* Delimiter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: isDark ? '#aaa' : '#555', fontSize: 14, flexShrink: 0 }}>
            Dấu phân cách:
          </span>
          <Select
            value={delimiter}
            onChange={(v) => {
              setDelimiter(v);
              setResult(null);
            }}
            style={{ minWidth: 180 }}
            options={[
              { value: 'auto', label: 'Tự động phát hiện' },
              { value: ',', label: 'Dấu phẩy (,)' },
              { value: ';', label: 'Chấm phẩy (;)' },
              { value: '\t', label: 'Tab (\\t)' },
              { value: '|', label: 'Pipe (|)' },
            ]}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(231,76,60,0.08)',
              border: '1px solid rgba(231,76,60,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#e74c3c',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Convert button */}
        <Button
          type="primary"
          size="large"
          icon={<SwapOutlined />}
          loading={converting}
          onClick={handleConvert}
          style={{
            width: '100%',
            height: 48,
            fontSize: 16,
            fontWeight: 700,
            background: PRIMARY,
            borderColor: PRIMARY,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          Chuyển đổi
        </Button>
      </div>

      {/* ── Section 2: Preview & Export ── */}
      {result && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TableOutlined style={{ fontSize: 16, color: PRIMARY }} />
            <span style={sectionTitleStyle}>Kết quả & Xuất file</span>
          </div>

          {/* Stats bar */}
          <div
            style={{
              background: statsBg,
              border: `1px solid ${panelBorder}`,
              borderRadius: 8,
              padding: '8px 14px',
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              fontSize: 13,
              color: isDark ? '#aaa' : '#666',
            }}
          >
            <span>
              <span style={{ color: PRIMARY, fontWeight: 700 }}>{result.rows.length}</span>
              {' '}dòng
            </span>
            <span>
              <span style={{ color: PRIMARY, fontWeight: 700 }}>{result.headers.length}</span>
              {' '}cột
            </span>
            <span>
              <span style={{ color: PRIMARY, fontWeight: 700 }}>{result.sizeKb.toFixed(1)}</span>
              {' '}KB
            </span>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['table', 'json'] as ViewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 6,
                  border: `1px solid ${viewTab === tab ? PRIMARY : panelBorder}`,
                  background: viewTab === tab ? PRIMARY_BG : 'transparent',
                  color: viewTab === tab ? PRIMARY : isDark ? '#aaa' : '#555',
                  fontWeight: viewTab === tab ? 700 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'table' ? 'Xem trước bảng' : 'JSON'}
              </button>
            ))}
          </div>

          {/* Table view */}
          {viewTab === 'table' && (
            <div>
              <Table
                columns={tableColumns}
                dataSource={tableData}
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={false}
                style={{
                  background: 'transparent',
                }}
                rowKey="key"
              />
              {result.rows.length > PREVIEW_LIMIT && (
                <div
                  style={{
                    marginTop: 10,
                    textAlign: 'center',
                    color: metaTextColor,
                    fontSize: 12,
                  }}
                >
                  Hiển thị {PREVIEW_LIMIT}/{result.rows.length} dòng trong xem trước. Tải xuống để xem đầy đủ.
                </div>
              )}
            </div>
          )}

          {/* JSON view */}
          {viewTab === 'json' && (
            <div style={{ position: 'relative' }}>
              <pre
                style={{
                  background: codeBg,
                  color: codeColor,
                  border: `1px solid ${panelBorder}`,
                  borderRadius: 8,
                  padding: '14px 16px',
                  fontSize: 12,
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  maxHeight: 360,
                  overflowY: 'auto',
                  margin: 0,
                  fontFamily: '"Fira Code", "Cascadia Code", monospace',
                }}
              >
                {jsonString}
              </pre>
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(jsonString);
                    messageApi.success('Đã sao chép JSON!');
                  } catch {
                    messageApi.error('Không thể sao chép.');
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: isDark ? '#2a2a2a' : '#fff',
                  borderColor: panelBorder,
                  color: isDark ? '#aaa' : '#555',
                }}
              >
                Sao chép
              </Button>
            </div>
          )}

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportToJson(result.headers, result.rows, `${result.filename}.json`)
              }
              style={{
                background: PRIMARY_BG,
                borderColor: PRIMARY_BORDER,
                color: PRIMARY,
                fontWeight: 600,
              }}
            >
              Tải JSON
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportToExcel(result.headers, result.rows, `${result.filename}.xls`)
              }
              style={{
                background: 'rgba(33,150,243,0.08)',
                borderColor: 'rgba(33,150,243,0.25)',
                color: '#2196f3',
                fontWeight: 600,
              }}
            >
              Tải Excel (.xls)
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportToCsv(result.headers, result.rows, `${result.filename}_cleaned.csv`)
              }
              style={{
                background: isDark ? '#1a1a1a' : '#f5f5f5',
                borderColor: panelBorder,
                color: isDark ? '#aaa' : '#555',
                fontWeight: 600,
              }}
            >
              Tải CSV
            </Button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!result && !error && (
        <div
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <TableOutlined style={{ fontSize: 48, color: isDark ? '#333' : '#ddd' }} />
          <span style={{ color: metaTextColor, fontSize: 14 }}>Chưa có dữ liệu</span>
          <span style={{ color: isDark ? '#444' : '#bbb', fontSize: 12, textAlign: 'center' }}>
            Tải lên hoặc dán dữ liệu CSV rồi nhấn "Chuyển đổi" để xem kết quả.
          </span>
        </div>
      )}
    </div>
  );
}
