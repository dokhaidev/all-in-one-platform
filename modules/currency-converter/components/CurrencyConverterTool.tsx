'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Select, message } from 'antd';
import {
  SwapOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

// ─── Flag map ─────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', VND: '🇻🇳', CNY: '🇨🇳',
  KRW: '🇰🇷', SGD: '🇸🇬', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', HKD: '🇭🇰',
  THB: '🇹🇭', MYR: '🇲🇾', INR: '🇮🇳', IDR: '🇮🇩', PHP: '🇵🇭', TWD: '🇹🇼',
  NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', BRL: '🇧🇷', ZAR: '🇿🇦',
  RUB: '🇷🇺', TRY: '🇹🇷', AED: '🇦🇪', SAR: '🇸🇦',
};

const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'VND', 'CNY', 'KRW', 'SGD', 'AUD', 'CAD'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(value: number, currency: string): string {
  const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 3 }) + ' tỷ';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 3 }) + ' triệu';
  }
  return value.toLocaleString(locale, {
    maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 4,
  });
}

function formatRate(rate: number, toCurrency: string): string {
  const locale = toCurrency === 'VND' ? 'vi-VN' : 'en-US';
  return rate.toLocaleString(locale, {
    maximumFractionDigits: toCurrency === 'JPY' || toCurrency === 'KRW' || toCurrency === 'VND' ? 2 : 6,
  });
}

function optionLabel(code: string, name: string): string {
  const flag = FLAG_MAP[code] ?? '';
  return flag ? `${flag} ${code} – ${name}` : `${code} – ${name}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CurrencyConverterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── theme tokens ──────────────────────────────────────────────────────────
  const panelBg   = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const innerBg   = isDark ? '#141414' : '#f9fafb';
  const innerBorder = isDark ? '#333' : '#d9d9d9';
  const textColor = isDark ? '#e0e0e0' : '#111111';
  const subColor  = isDark ? '#888' : '#777';
  const mutedColor = isDark ? '#555' : '#bbb';

  // ── state ─────────────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency]     = useState('VND');
  const [amount, setAmount]             = useState<number>(1);

  const [rate, setRate]         = useState<number | null>(null);
  const [result, setResult]     = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [swapRotated, setSwapRotated] = useState(false);
  const [copied, setCopied]     = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── fetch currency list on mount ──────────────────────────────────────────
  useEffect(() => {
    fetch('https://api.frankfurter.app/currencies')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setCurrencies(data);
        setLoadingCurrencies(false);
      })
      .catch(() => {
        setLoadingCurrencies(false);
        setError('Không thể tải danh sách tiền tệ.');
      });
  }, []);

  // ── fetch rate with debounce ──────────────────────────────────────────────
  const fetchRate = useCallback(
    (from: string, to: string, amt: number) => {
      if (!from || !to || from === to) {
        const r = 1;
        setRate(r);
        setResult(amt * r);
        setError(null);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoadingRate(true);
        setError(null);
        try {
          const res = await fetch(
            `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
            { signal: abortRef.current.signal }
          );
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          const r: number = data.rates[to];
          if (r == null) throw new Error('Rate not found');
          setRate(r);
          setResult(amt * r);
          setLastUpdated(new Date());
          setError(null);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return;
          setError('Không thể lấy tỷ giá. Vui lòng thử lại sau.');
          setRate(null);
          setResult(null);
        } finally {
          setLoadingRate(false);
        }
      }, 400);
    },
    []
  );

  // trigger fetch whenever from/to/amount changes
  useEffect(() => {
    fetchRate(fromCurrency, toCurrency, amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency, toCurrency, amount]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSwap = () => {
    setSwapRotated((r) => !r);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleReset = () => {
    setFromCurrency('USD');
    setToCurrency('VND');
    setAmount(1);
    setRate(null);
    setResult(null);
    setError(null);
    setLastUpdated(null);
  };

  const handleCopy = () => {
    if (result == null) return;
    const text = `${formatAmount(result, toCurrency)} ${toCurrency}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      message.success('Đã sao chép kết quả!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── build select options (popular first, then separator, then rest) ────────
  const buildOptions = () => {
    if (loadingCurrencies) return [];
    const popularOptions = POPULAR.filter((c) => currencies[c]).map((code) => ({
      value: code,
      label: optionLabel(code, currencies[code]),
      searchText: `${code} ${currencies[code]}`.toLowerCase(),
    }));
    const rest = Object.entries(currencies)
      .filter(([c]) => !POPULAR.includes(c))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, name]) => ({
        value: code,
        label: optionLabel(code, name),
        searchText: `${code} ${name}`.toLowerCase(),
      }));

    return [
      {
        label: (
          <span style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: '0.05em' }}>
            PHỔ BIẾN
          </span>
        ),
        options: popularOptions,
      },
      {
        label: (
          <span style={{ fontSize: 11, fontWeight: 600, color: subColor, letterSpacing: '0.05em' }}>
            TẤT CẢ
          </span>
        ),
        options: rest,
      },
    ];
  };

  const filterOption = (input: string, option?: { searchText?: string; label?: React.ReactNode; value?: string }) => {
    if (!option) return false;
    const search = (option.searchText ?? '').toLowerCase();
    const q = input.toLowerCase();
    return search.includes(q);
  };

  // ── derived display values ─────────────────────────────────────────────────
  const fromFlag = FLAG_MAP[fromCurrency] ?? '';
  const toFlag   = FLAG_MAP[toCurrency] ?? '';
  const fromName = currencies[fromCurrency] ?? fromCurrency;
  const toName   = currencies[toCurrency] ?? toCurrency;

  const selectStyles = {
    width: '100%',
  };

  // ── shared input style ─────────────────────────────────────────────────────
  const amountInputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: 28,
    fontWeight: 700,
    color: PRIMARY,
    background: innerBg,
    border: `1.5px solid ${innerBorder}`,
    borderRadius: 10,
    padding: '12px 18px',
    outline: 'none',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    appearance: 'none' as const,
    MozAppearance: 'textfield' as const,
  };

  // ── skeleton rows ──────────────────────────────────────────────────────────
  const SkeletonLine = ({ w = '100%', h = 20 }: { w?: string | number; h?: number }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: isDark ? '#2a2a2a' : '#e8e8e8',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .swap-btn:hover { background: rgba(80,200,120,0.15) !important; border-color: ${PRIMARY} !important; }
        .copy-btn:hover { background: rgba(80,200,120,0.1) !important; color: ${PRIMARY} !important; }
        .reset-btn:hover { background: rgba(80,200,120,0.06) !important; color: ${PRIMARY} !important; border-color: ${PRIMARY} !important; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      <div style={{ width: '100%' }}>
        {/* ── Main card ── */}
        <div
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 14,
            padding: '28px 28px 24px',
            marginBottom: 20,
          }}
        >
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SwapOutlined style={{ fontSize: 18, color: PRIMARY }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Quy đổi tiền tệ</span>
            </div>
            <button
              className="reset-btn"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${panelBorder}`,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: subColor,
                transition: 'all 0.18s',
              }}
            >
              <ReloadOutlined style={{ fontSize: 12 }} />
              Đặt lại
            </button>
          </div>

          {/* ── Currency row ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            {/* FROM */}
            <div style={{ flex: '1 1 200px', minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Từ tiền tệ
              </label>
              <Select
                showSearch
                value={fromCurrency}
                onChange={(v) => setFromCurrency(v)}
                options={buildOptions()}
                filterOption={filterOption}
                style={selectStyles}
                size="large"
                loading={loadingCurrencies}
                notFoundContent="Không tìm thấy"
                popupMatchSelectWidth={320}
              />
            </div>

            {/* SWAP button */}
            <div style={{ flexShrink: 0, paddingBottom: 2 }}>
              <button
                className="swap-btn"
                onClick={handleSwap}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: PRIMARY_BG,
                  border: `1px solid ${PRIMARY_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <SwapOutlined
                  style={{
                    fontSize: 18,
                    color: PRIMARY,
                    transform: swapRotated ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </button>
            </div>

            {/* TO */}
            <div style={{ flex: '1 1 200px', minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Sang tiền tệ
              </label>
              <Select
                showSearch
                value={toCurrency}
                onChange={(v) => setToCurrency(v)}
                options={buildOptions()}
                filterOption={filterOption}
                style={selectStyles}
                size="large"
                loading={loadingCurrencies}
                notFoundContent="Không tìm thấy"
                popupMatchSelectWidth={320}
              />
            </div>
          </div>

          {/* ── Amount input ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Số tiền {fromFlag} {fromCurrency}
            </label>
            <input
              type="number"
              value={amount}
              min={0}
              step="any"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setAmount(isNaN(v) ? 0 : v);
              }}
              style={amountInputStyle}
              placeholder="Nhập số tiền..."
            />
          </div>

          {/* ── Result panel ── */}
          <div
            style={{
              background: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1.5px solid ${loadingRate ? PRIMARY_BORDER : panelBorder}`,
              borderRadius: 12,
              padding: '22px 24px',
              transition: 'border-color 0.2s',
            }}
          >
            {loadingRate ? (
              /* skeleton */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LoadingOutlined style={{ color: PRIMARY, fontSize: 14 }} />
                  <span style={{ fontSize: 13, color: subColor }}>Đang cập nhật...</span>
                </div>
                <SkeletonLine h={42} w="60%" />
                <SkeletonLine h={16} w="40%" />
              </div>
            ) : error ? (
              /* error state */
              <div
                style={{
                  background: 'rgba(220,53,69,0.08)',
                  border: '1px solid rgba(220,53,69,0.25)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: '#e05c6b',
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            ) : result != null && rate != null ? (
              /* result */
              <div>
                {/* Amount being converted */}
                <div style={{ fontSize: 13, color: subColor, marginBottom: 6 }}>
                  {formatAmount(amount, fromCurrency)} {fromFlag} {fromCurrency} ({fromName}) =
                </div>

                {/* Big result */}
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: PRIMARY,
                    lineHeight: 1.1,
                    letterSpacing: '-0.5px',
                    fontVariantNumeric: 'tabular-nums',
                    marginBottom: 10,
                  }}
                >
                  {formatAmount(result, toCurrency)}{' '}
                  <span style={{ fontSize: 22, fontWeight: 600 }}>
                    {toFlag} {toCurrency}
                  </span>
                </div>

                {/* Exchange rate info */}
                <div
                  style={{
                    fontSize: 13,
                    color: subColor,
                    marginBottom: 14,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px 16px',
                  }}
                >
                  <span>
                    1 {fromCurrency} = {formatRate(rate, toCurrency)} {toCurrency}
                  </span>
                  {fromCurrency !== toCurrency && rate !== 0 && (
                    <span style={{ color: mutedColor }}>
                      1 {toCurrency} = {formatRate(1 / rate, fromCurrency)} {fromCurrency}
                    </span>
                  )}
                </div>

                {/* Action row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  {/* Copy button */}
                  <button
                    className="copy-btn"
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      background: isDark ? '#242424' : '#efefef',
                      border: `1px solid ${panelBorder}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: subColor,
                      transition: 'all 0.15s',
                    }}
                  >
                    {copied
                      ? <CheckCircleOutlined style={{ color: PRIMARY }} />
                      : <CopyOutlined />}
                    {copied ? 'Đã sao chép!' : 'Sao chép kết quả'}
                  </button>

                  {/* Last updated */}
                  {lastUpdated && (
                    <span style={{ fontSize: 12, color: mutedColor }}>
                      Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* initial/empty state */
              <div style={{ textAlign: 'center', padding: '16px 0', color: mutedColor, fontSize: 14 }}>
                Nhập số tiền và chọn loại tiền tệ để quy đổi
              </div>
            )}
          </div>
        </div>

        {/* ── Info cards row ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Popular currencies quick-select */}
          <div
            style={{
              flex: '1 1 300px',
              background: panelBg,
              border: `1px solid ${panelBorder}`,
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: subColor, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
              Tiền tệ phổ biến
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR.map((code) => {
                const isFrom = fromCurrency === code;
                const isTo   = toCurrency === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      if (!isFrom && !isTo) setToCurrency(code);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: isFrom
                        ? `1.5px solid ${PRIMARY}`
                        : isTo
                        ? `1.5px solid rgba(80,200,120,0.5)`
                        : `1px solid ${panelBorder}`,
                      background: isFrom
                        ? PRIMARY_BG
                        : isTo
                        ? 'rgba(80,200,120,0.05)'
                        : 'transparent',
                      color: isFrom ? PRIMARY : isTo ? PRIMARY : subColor,
                      fontSize: 13,
                      fontWeight: isFrom || isTo ? 600 : 400,
                      cursor: isFrom ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {FLAG_MAP[code] ?? ''} {code}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: mutedColor }}>
              Nhấn để đặt là tiền tệ đích. Viền đậm = từ, viền mờ = sang.
            </div>
          </div>

          {/* Source / disclaimer */}
          <div
            style={{
              flex: '1 1 240px',
              background: panelBg,
              border: `1px solid ${panelBorder}`,
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: subColor, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
              Nguồn dữ liệu
            </div>
            <p style={{ fontSize: 13, color: subColor, margin: '0 0 10px', lineHeight: 1.7 }}>
              Tỷ giá được cung cấp bởi{' '}
              <span style={{ color: PRIMARY, fontWeight: 600 }}>Frankfurter API</span>{' '}
              — nguồn dữ liệu miễn phí, cập nhật hằng ngày từ Ngân hàng Trung ương Châu Âu (ECB).
            </p>
            <p style={{ fontSize: 12, color: mutedColor, margin: 0, lineHeight: 1.6 }}>
              Tỷ giá mang tính tham khảo. Tỷ giá thực tế tại ngân hàng hoặc sàn giao dịch có thể khác.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
