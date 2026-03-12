'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Input, Tabs, Tag, Tooltip, message, Empty, Badge } from 'antd';
import { SearchOutlined, CopyOutlined, ApiOutlined, NumberOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';

// ── Data ──────────────────────────────────────────────────────────────────────
interface HttpCode {
  code: number;
  name: string;
  category: string;
  description: string;
  whenToUse: string;
  example: string;
}

const HTTP_CODES: HttpCode[] = [
  // 1xx
  { code: 100, category: '1xx', name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', whenToUse: 'Use when the client needs confirmation before sending a large request body.', example: 'Client sends large POST with "Expect: 100-continue" header first.' },
  { code: 101, category: '1xx', name: 'Switching Protocols', description: 'The server agrees to switch to the protocol requested by the client.', whenToUse: 'Upgrading from HTTP to WebSocket or HTTP/2.', example: 'WebSocket handshake upgrade from HTTP/1.1.' },
  { code: 102, category: '1xx', name: 'Processing', description: 'Server has received and is processing the request, but no response is available yet (WebDAV).', whenToUse: 'Long-running requests to prevent client timeout.', example: 'Large file upload or complex WebDAV operation.' },
  { code: 103, category: '1xx', name: 'Early Hints', description: 'Allows the server to send response headers before the final response, enabling preloading.', whenToUse: 'Preloading critical resources (CSS, fonts) before page is ready.', example: 'Server hints browser to preload stylesheet while rendering page.' },

  // 2xx
  { code: 200, category: '2xx', name: 'OK', description: 'The request was successful. The meaning of success depends on the HTTP method used.', whenToUse: 'Standard success response for GET, POST, PUT, PATCH requests.', example: 'GET /users/123 returns user data successfully.' },
  { code: 201, category: '2xx', name: 'Created', description: 'A new resource has been successfully created as a result of the request.', whenToUse: 'POST requests that create a new resource. Should include Location header.', example: 'POST /users creates a new user; response includes /users/456.' },
  { code: 202, category: '2xx', name: 'Accepted', description: 'The request has been accepted for processing, but the processing has not been completed.', whenToUse: 'Asynchronous operations — the task is queued but not done yet.', example: 'POST /send-email queues email; processing happens in background.' },
  { code: 203, category: '2xx', name: 'Non-Authoritative Information', description: 'Returned metadata is not from the origin server but a local or third-party copy.', whenToUse: 'Proxy servers that modify or transform responses.', example: 'CDN or caching proxy returns modified headers.' },
  { code: 204, category: '2xx', name: 'No Content', description: 'The server successfully processed the request but is not returning any content.', whenToUse: 'DELETE requests or updates where no body needs to be returned.', example: 'DELETE /users/123 — user deleted, no body returned.' },
  { code: 205, category: '2xx', name: 'Reset Content', description: 'The server processed the request; client should reset the document view.', whenToUse: 'Form submissions where the form should be cleared after success.', example: 'After submitting a search form, clear form inputs.' },
  { code: 206, category: '2xx', name: 'Partial Content', description: 'The server is delivering only part of the resource due to a Range header sent by the client.', whenToUse: 'Resumable downloads, video streaming with range requests.', example: 'GET /video.mp4 with Range: bytes=0-1023 for streaming.' },
  { code: 207, category: '2xx', name: 'Multi-Status', description: 'Conveys information about multiple resources, for situations involving multiple status codes (WebDAV).', whenToUse: 'WebDAV operations affecting multiple resources at once.', example: 'PROPFIND returns status for multiple files in a directory.' },
  { code: 208, category: '2xx', name: 'Already Reported', description: 'Members of a DAV binding have already been enumerated in a preceding part of the response (WebDAV).', whenToUse: 'Avoid re-enumerating same binding in WebDAV responses.', example: 'WebDAV PROPFIND with internal members already reported.' },
  { code: 226, category: '2xx', name: 'IM Used', description: 'The server has fulfilled a GET request and the response is a result of instance-manipulations applied.', whenToUse: 'HTTP delta encoding — returning diff of resource.', example: 'Client requests only the changes since last fetch using delta encoding.' },

  // 3xx
  { code: 300, category: '3xx', name: 'Multiple Choices', description: 'The request has more than one possible response. The user or client should choose one.', whenToUse: 'Content negotiation when multiple representations exist.', example: 'API endpoint serving JSON or XML depending on Accept header.' },
  { code: 301, category: '3xx', name: 'Moved Permanently', description: 'The requested resource has been permanently moved to a new URL.', whenToUse: 'Permanent URL changes; search engines update their index. Use 308 for non-GET.', example: 'http://example.com permanently redirects to https://example.com.' },
  { code: 302, category: '3xx', name: 'Found', description: 'The resource is temporarily at a different URI. The method may change (see 307 for stricter).', whenToUse: 'Temporary redirects where original URL may be used again soon.', example: 'Redirect to maintenance page temporarily.' },
  { code: 303, category: '3xx', name: 'See Other', description: 'The server directs the client to get the requested resource at another URI with a GET request.', whenToUse: 'After POST/PUT/DELETE, redirect to a confirmation page (POST/Redirect/GET pattern).', example: 'POST /checkout redirects to GET /order/123/confirmation.' },
  { code: 304, category: '3xx', name: 'Not Modified', description: 'The client\'s cached version is still valid; no need to retransmit the resource.', whenToUse: 'Browser caching — resource has not changed since last request.', example: 'Conditional GET with If-None-Match; ETag matches, return 304.' },
  { code: 307, category: '3xx', name: 'Temporary Redirect', description: 'Temporary redirect; the method and body must not change when following the redirect.', whenToUse: 'Temporary redirect that must preserve the HTTP method (POST stays POST).', example: 'POST /api/v1/data temporarily redirects to POST /api/v2/data.' },
  { code: 308, category: '3xx', name: 'Permanent Redirect', description: 'Permanent redirect; the method and body must not change when following the redirect.', whenToUse: 'Permanent URL migration where the method must be preserved.', example: 'POST /api/old permanently redirects to POST /api/new.' },

  // 4xx
  { code: 400, category: '4xx', name: 'Bad Request', description: 'The server cannot process the request due to invalid syntax or malformed request.', whenToUse: 'Invalid JSON body, missing required fields, type mismatch.', example: 'POST /users with invalid JSON body returns 400.' },
  { code: 401, category: '4xx', name: 'Unauthorized', description: 'Authentication is required and has failed, or has not been provided.', whenToUse: 'Missing or invalid auth token/credentials. Client should authenticate.', example: 'GET /profile without a valid JWT returns 401.' },
  { code: 402, category: '4xx', name: 'Payment Required', description: 'Reserved for future use; currently used for digital payment systems.', whenToUse: 'Paywall, API rate limit exceeded requiring paid plan.', example: 'API returns 402 when free tier quota is exceeded.' },
  { code: 403, category: '4xx', name: 'Forbidden', description: 'The client is authenticated but does not have permission to access this resource.', whenToUse: 'Insufficient permissions. Different from 401 — identity is known but access is denied.', example: 'User logged in but tries to access admin-only endpoint.' },
  { code: 404, category: '4xx', name: 'Not Found', description: 'The server cannot find the requested resource. The URL is not recognized.', whenToUse: 'Resource does not exist. Also used to obscure 403 for security.', example: 'GET /users/999 when user with id 999 does not exist.' },
  { code: 405, category: '4xx', name: 'Method Not Allowed', description: 'The request method is not supported for the targeted resource.', whenToUse: 'Client uses wrong HTTP verb (e.g., DELETE on read-only endpoint).', example: 'DELETE /config — the endpoint only accepts GET.' },
  { code: 406, category: '4xx', name: 'Not Acceptable', description: 'The resource cannot generate a response matching the Accept headers sent by the client.', whenToUse: 'Content negotiation fails — server cannot satisfy Accept header.', example: 'Client requests XML but server only serves JSON.' },
  { code: 407, category: '4xx', name: 'Proxy Authentication Required', description: 'Authentication must be done via the proxy before the request can proceed.', whenToUse: 'Corporate proxies requiring authentication credentials.', example: 'Request goes through proxy that requires credentials.' },
  { code: 408, category: '4xx', name: 'Request Timeout', description: 'The server timed out waiting for the request from the client.', whenToUse: 'Client is too slow sending the request body; idle connections.', example: 'Client started a file upload but took too long to send data.' },
  { code: 409, category: '4xx', name: 'Conflict', description: 'The request conflicts with the current state of the resource.', whenToUse: 'Version conflicts, duplicate resource creation, concurrent updates.', example: 'POST /users with email that already exists returns 409.' },
  { code: 410, category: '4xx', name: 'Gone', description: 'The resource is permanently deleted and will not be available again.', whenToUse: 'Permanently removed resources; stronger signal than 404.', example: 'Deleted blog post with no redirect — permanently gone.' },
  { code: 411, category: '4xx', name: 'Length Required', description: 'The server refuses to accept the request without a Content-Length header.', whenToUse: 'Endpoints that require explicit Content-Length for streaming.', example: 'POST without Content-Length when server requires it.' },
  { code: 412, category: '4xx', name: 'Precondition Failed', description: 'One or more conditions in the request header fields evaluated to false on the server.', whenToUse: 'Conditional requests — optimistic locking, If-Match header fails.', example: 'PUT with If-Match ETag that no longer matches current version.' },
  { code: 413, category: '4xx', name: 'Content Too Large', description: 'The request body is larger than the server is willing or able to process.', whenToUse: 'File uploads exceeding server size limit.', example: 'POST /upload with 50MB file when limit is 10MB.' },
  { code: 414, category: '4xx', name: 'URI Too Long', description: 'The URI requested by the client is longer than the server can process.', whenToUse: 'Extremely long query strings or deeply nested paths.', example: 'GET request with thousands of characters in query string.' },
  { code: 415, category: '4xx', name: 'Unsupported Media Type', description: 'The request body is in a format not supported by the server for this resource.', whenToUse: 'Wrong Content-Type header (e.g., sending XML to JSON-only API).', example: 'POST with Content-Type: text/xml to an API expecting application/json.' },
  { code: 416, category: '4xx', name: 'Range Not Satisfiable', description: 'The range specified in the Range header cannot be fulfilled.', whenToUse: 'Range request where the specified range is out of bounds.', example: 'Range: bytes=1000-2000 on a 500-byte file.' },
  { code: 417, category: '4xx', name: 'Expectation Failed', description: 'The expectation given in the Expect request header cannot be met by the server.', whenToUse: 'Server cannot fulfill the Expect: 100-continue requirement.', example: 'Server returns 417 when it rejects an Expect header value.' },
  { code: 418, category: '4xx', name: "I'm a Teapot", description: 'An April Fools joke — the server refuses to brew coffee because it is a teapot (RFC 2324).', whenToUse: 'Easter eggs, joke endpoints, trolling bots.', example: 'GET /coffee on a server that is, in fact, a teapot.' },
  { code: 421, category: '4xx', name: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response.', whenToUse: 'HTTP/2 connection reuse where server cannot serve the origin.', example: 'HTTP/2 misdirected to wrong virtual host.' },
  { code: 422, category: '4xx', name: 'Unprocessable Content', description: 'The request body is well-formed but contains semantic errors that prevent processing.', whenToUse: 'Validation errors — correct syntax but invalid business logic (e.g., age is negative).', example: 'POST /users with age: -5 — valid JSON but invalid value.' },
  { code: 423, category: '4xx', name: 'Locked', description: 'The resource being accessed is locked (WebDAV).', whenToUse: 'WebDAV file locking; resource checked out by another user.', example: 'PUT /file.doc when another user has an exclusive lock.' },
  { code: 424, category: '4xx', name: 'Failed Dependency', description: 'The request failed because it depended on another request that failed (WebDAV).', whenToUse: 'Batch operations where one operation depends on another.', example: 'WebDAV COPY fails because LOCK operation it depends on failed.' },
  { code: 425, category: '4xx', name: 'Too Early', description: 'The server is unwilling to risk processing a request that might be replayed.', whenToUse: 'TLS 1.3 early data (0-RTT) that is not safe to replay.', example: 'Prevent replay attacks on TLS 0-RTT requests.' },
  { code: 426, category: '4xx', name: 'Upgrade Required', description: 'The client should switch to a different protocol as specified in the Upgrade header.', whenToUse: 'Force protocol upgrade (e.g., from HTTP/1.1 to HTTP/2 or TLS).', example: 'Server requires HTTPS; plain HTTP request returns 426.' },
  { code: 428, category: '4xx', name: 'Precondition Required', description: 'The server requires the request to be conditional to avoid lost updates.', whenToUse: 'Enforce optimistic locking — request must include If-Match.', example: 'PUT /resource without If-Match when server requires it.' },
  { code: 429, category: '4xx', name: 'Too Many Requests', description: 'The user has sent too many requests in a given time frame (rate limiting).', whenToUse: 'API rate limiting; include Retry-After header.', example: 'API returns 429 after 100 requests/minute quota is exceeded.' },
  { code: 431, category: '4xx', name: 'Request Header Fields Too Large', description: 'The server is unwilling to process the request because its header fields are too large.', whenToUse: 'Oversized cookies, too many headers, very long header values.', example: 'Request with accumulated large cookies exceeding server limit.' },
  { code: 451, category: '4xx', name: 'Unavailable For Legal Reasons', description: 'The resource has been blocked for legal reasons (e.g., court order, government censorship).', whenToUse: 'Content blocked by DMCA, regional law, or government order.', example: 'GDPR-related content restriction or DMCA takedown.' },

  // 5xx
  { code: 500, category: '5xx', name: 'Internal Server Error', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.', whenToUse: 'Unhandled exceptions, database failures, unexpected server-side errors.', example: 'Uncaught exception in request handler — generic server failure.' },
  { code: 501, category: '5xx', name: 'Not Implemented', description: 'The server does not support the functionality required to fulfill the request.', whenToUse: 'HTTP method not recognized or not implemented by the server.', example: 'PATCH /resource on a server that only supports GET and POST.' },
  { code: 502, category: '5xx', name: 'Bad Gateway', description: 'The server, acting as a gateway or proxy, received an invalid response from the upstream server.', whenToUse: 'Upstream server returned garbage or crashed mid-response.', example: 'Nginx proxy receives malformed response from Node.js app.' },
  { code: 503, category: '5xx', name: 'Service Unavailable', description: 'The server is temporarily unable to handle the request due to overload or maintenance.', whenToUse: 'Planned maintenance, server overload, deployment downtime.', example: 'Server returns 503 with Retry-After during scheduled maintenance.' },
  { code: 504, category: '5xx', name: 'Gateway Timeout', description: 'The server, acting as a gateway, did not receive a timely response from the upstream server.', whenToUse: 'Upstream server too slow or timed out; proxy timeout.', example: 'Load balancer times out waiting for app server response after 30s.' },
  { code: 505, category: '5xx', name: 'HTTP Version Not Supported', description: 'The server does not support the HTTP protocol version used in the request.', whenToUse: 'Client uses HTTP version the server cannot handle.', example: 'Request using HTTP/3 to a server that only supports HTTP/1.1.' },
  { code: 506, category: '5xx', name: 'Variant Also Negotiates', description: 'The server has a configuration error in transparent content negotiation.', whenToUse: 'Circular reference in content negotiation configuration.', example: 'Server misconfigured — variant resource is also negotiatable.' },
  { code: 507, category: '5xx', name: 'Insufficient Storage', description: 'The method could not be performed because the server cannot store the required representation (WebDAV).', whenToUse: 'Server disk is full; cannot save uploaded file or data.', example: 'File upload fails because server storage quota is exceeded.' },
  { code: 508, category: '5xx', name: 'Loop Detected', description: 'The server detected an infinite loop while processing a request (WebDAV).', whenToUse: 'WebDAV PROPFIND detects cyclic directory references.', example: 'Symbolic link loop in WebDAV directory structure.' },
  { code: 510, category: '5xx', name: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfil it.', whenToUse: 'HTTP extension policy not met; server requires additional headers.', example: 'Request does not satisfy mandatory HTTP extension requirements.' },
  { code: 511, category: '5xx', name: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access (captive portal).', whenToUse: 'Captive portals in hotels, airports, coffee shops.', example: 'Hotel WiFi returns 511 to redirect to login/payment portal.' },
];

const ALL_CATEGORIES = ['All', '1xx', '2xx', '3xx', '4xx', '5xx'];

const CATEGORY_META: Record<string, { label: string; color: string; description: string }> = {
  '1xx': { label: '1xx Informational', color: '#1677ff', description: 'Request received, continuing process' },
  '2xx': { label: '2xx Success', color: '#52c41a', description: 'Request successfully received, understood, and accepted' },
  '3xx': { label: '3xx Redirection', color: '#faad14', description: 'Further action must be taken to complete the request' },
  '4xx': { label: '4xx Client Error', color: '#fa8c16', description: 'The request contains bad syntax or cannot be fulfilled' },
  '5xx': { label: '5xx Server Error', color: '#f5222d', description: 'The server failed to fulfil an apparently valid request' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function HttpStatusCodesTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [quickLookup, setQuickLookup] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const codeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222' : '#fff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#111';
  const mutedColor = isDark ? '#666' : '#aaa';
  const subCardBg = isDark ? '#1a1a1a' : '#f9f9f9';

  const copyCode = useCallback((code: number) => {
    navigator.clipboard.writeText(String(code)).then(() => {
      messageApi.success({ content: `Copied "${code}"`, duration: 1.2 });
    }).catch(() => messageApi.error({ content: 'Copy failed', duration: 1 }));
  }, [messageApi]);

  // Quick lookup: jump to code
  const handleQuickLookup = useCallback(() => {
    const num = parseInt(quickLookup.trim(), 10);
    if (isNaN(num)) return;
    const found = HTTP_CODES.find(c => c.code === num);
    if (!found) {
      messageApi.warning({ content: `Code ${num} not found`, duration: 1.5 });
      return;
    }
    const cat = found.category;
    setActiveTab(cat);
    setSearch('');
    // Wait a tick for tab to render
    setTimeout(() => {
      const el = codeRefs.current[num];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = `2px solid ${PRIMARY}`;
        setTimeout(() => { el.style.outline = ''; }, 1800);
      }
    }, 80);
  }, [quickLookup, messageApi]);

  const filterText = search.toLowerCase().trim();

  const filteredCodes = useMemo(() => {
    let list = HTTP_CODES;
    if (activeTab !== 'All') {
      list = list.filter(c => c.category === activeTab);
    }
    if (filterText) {
      list = list.filter(c =>
        String(c.code).includes(filterText) ||
        c.name.toLowerCase().includes(filterText) ||
        c.description.toLowerCase().includes(filterText) ||
        c.whenToUse.toLowerCase().includes(filterText) ||
        c.example.toLowerCase().includes(filterText)
      );
    }
    return list;
  }, [activeTab, filterText]);

  const groupedCodes = useMemo(() => {
    if (activeTab !== 'All') return null;
    const groups: Record<string, HttpCode[]> = {};
    for (const code of filteredCodes) {
      if (!groups[code.category]) groups[code.category] = [];
      groups[code.category].push(code);
    }
    return groups;
  }, [activeTab, filteredCodes]);

  const tabItems = ALL_CATEGORIES.map(cat => {
    const count = cat === 'All'
      ? HTTP_CODES.length
      : HTTP_CODES.filter(c => c.category === cat).length;
    const meta = CATEGORY_META[cat];
    return {
      key: cat,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>{meta ? meta.label : 'All'}</span>
          <Badge
            count={count}
            style={{
              background: cat === activeTab ? (meta?.color ?? PRIMARY) : (isDark ? '#333' : '#ddd'),
              color: cat === activeTab ? '#fff' : (isDark ? '#aaa' : '#666'),
              fontSize: 10,
              boxShadow: 'none',
              minWidth: 18,
              height: 18,
              lineHeight: '18px',
            }}
          />
        </span>
      ),
    };
  });

  function CodeCard({ item }: { item: HttpCode }) {
    const meta = CATEGORY_META[item.category];
    const color = meta?.color ?? '#666';
    return (
      <div
        ref={el => { codeRefs.current[item.code] = el; }}
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'border-color 0.15s, outline 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = color + '66')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
      >
        {/* Header strip */}
        <div
          style={{
            background: color + '18',
            borderBottom: `1px solid ${color}33`,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Code badge — click to copy */}
          <Tooltip title="Click to copy code">
            <div
              onClick={() => copyCode(item.code)}
              style={{
                background: color,
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 800,
                borderRadius: 8,
                padding: '4px 12px',
                cursor: 'pointer',
                letterSpacing: '0.03em',
                userSelect: 'none',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {item.code}
              <CopyOutlined style={{ fontSize: 12, opacity: 0.75 }} />
            </div>
          </Tooltip>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: headingColor, lineHeight: 1.2 }}>
              {item.name}
            </div>
            <Tag
              style={{
                background: color + '22',
                border: `1px solid ${color}44`,
                color: color,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 3,
                padding: '0 5px',
                margin: '3px 0 0',
                lineHeight: '18px',
              }}
            >
              {meta?.label}
            </Tag>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Description */}
          <p style={{ margin: 0, fontSize: 13, color: textColor, lineHeight: 1.6 }}>
            {item.description}
          </p>

          {/* When to use */}
          <div
            style={{
              background: subCardBg,
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 3, letterSpacing: '0.06em' }}>
              WHEN TO USE
            </div>
            <p style={{ margin: 0, fontSize: 12, color: textColor, lineHeight: 1.5 }}>
              {item.whenToUse}
            </p>
          </div>

          {/* Example */}
          <div
            style={{
              background: isDark ? '#1a2a1a' : '#f0fff4',
              border: `1px solid ${isDark ? 'rgba(80,200,120,0.2)' : 'rgba(80,200,120,0.35)'}`,
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 3, letterSpacing: '0.06em' }}>
              EXAMPLE SCENARIO
            </div>
            <p style={{ margin: 0, fontSize: 12, color: isDark ? '#a0d8a0' : '#2d6a4f', lineHeight: 1.5 }}>
              {item.example}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderGroup(cat: string, items: HttpCode[]) {
    const meta = CATEGORY_META[cat];
    return (
      <div key={cat} style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: `2px solid ${(meta?.color ?? PRIMARY) + '44'}`,
          }}
        >
          <div
            style={{
              background: meta?.color ?? PRIMARY,
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              borderRadius: 6,
              padding: '3px 10px',
              letterSpacing: '0.04em',
              fontFamily: 'monospace',
            }}
          >
            {cat}
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: headingColor }}>{meta?.label}</span>
            <span style={{ fontSize: 12, color: mutedColor, marginLeft: 8 }}>— {meta?.description}</span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: mutedColor }}>
            {items.length} code{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 14,
          }}
        >
          {items.map(item => <CodeCard key={item.code} item={item} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: '100%', color: textColor }}>
      {contextHolder}

      {/* Top toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <Input
          prefix={<SearchOutlined style={{ color: PRIMARY }} />}
          placeholder="Search by code number or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            color: textColor,
            borderRadius: 8,
            flex: '1 1 280px',
            maxWidth: 460,
          }}
        />

        {/* Quick lookup */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            prefix={<NumberOutlined style={{ color: PRIMARY, fontSize: 12 }} />}
            placeholder="Quick lookup: 404"
            value={quickLookup}
            onChange={e => setQuickLookup(e.target.value)}
            onPressEnter={handleQuickLookup}
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              color: textColor,
              borderRadius: 8,
              width: 180,
            }}
            maxLength={3}
          />
          <button
            onClick={handleQuickLookup}
            style={{
              background: PRIMARY,
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              height: 32,
              whiteSpace: 'nowrap',
            }}
          >
            Jump
          </button>
        </div>

        {filterText && (
          <span style={{ fontSize: 12, color: mutedColor }}>
            {filteredCodes.length} result{filteredCodes.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Category summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = HTTP_CODES.filter(c => c.category === key).length;
          const isActive = activeTab === key;
          return (
            <div
              key={key}
              onClick={() => setActiveTab(isActive ? 'All' : key)}
              style={{
                background: isActive ? meta.color + '22' : cardBg,
                border: `1px solid ${isActive ? meta.color + '66' : border}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 11, color: meta.color, fontWeight: 700, marginBottom: 2 }}>{key}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: headingColor, lineHeight: 1.3 }}>{meta.label.replace(key + ' ', '')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: meta.color, marginTop: 4 }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <style>{`
          .http-tabs .ant-tabs-nav {
            padding: 0 12px;
            margin-bottom: 0 !important;
            border-bottom: 1px solid ${border};
            overflow-x: auto;
          }
          .http-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${PRIMARY} !important;
          }
          .http-tabs .ant-tabs-ink-bar {
            background: ${PRIMARY} !important;
          }
        `}</style>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems.map(t => ({ ...t, children: null }))}
          className="http-tabs"
          tabBarStyle={{ background: isDark ? '#1a1a1a' : '#fafafa' }}
          style={{ padding: 0 }}
        />
      </div>

      {/* Content */}
      {filteredCodes.length === 0 ? (
        <Empty
          description={<span style={{ color: mutedColor }}>No HTTP status codes found.</span>}
          style={{ padding: '40px 0' }}
        />
      ) : activeTab === 'All' && !filterText && groupedCodes ? (
        <div>
          {Object.entries(groupedCodes).map(([cat, items]) => renderGroup(cat, items))}
        </div>
      ) : (
        <div>
          {activeTab !== 'All' && !filterText && CATEGORY_META[activeTab] && (
            <div style={{ marginBottom: 16 }}>
              {renderGroup(activeTab, filteredCodes)}
            </div>
          )}
          {(filterText || activeTab === 'All') && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 14,
              }}
            >
              {filteredCodes.map(item => <CodeCard key={item.code} item={item} />)}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          padding: '10px 16px',
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: mutedColor,
        }}
      >
        <ApiOutlined style={{ color: PRIMARY }} />
        <span>
          {HTTP_CODES.length} HTTP status codes — click any code badge to copy it &nbsp;|&nbsp;
          Use the Quick Lookup field to jump directly to any code number
        </span>
      </div>
    </div>
  );
}
