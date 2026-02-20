import { useRef, useState } from 'react';
import { createSheetLinkTokenApi } from '../../apis/admin/adminApi.js';

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, el.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return !!ok;
  } catch {
    return false;
  }
}

const pageStyle = {
  padding: 'clamp(12px, 4vw, 24px)',
  paddingLeft: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-left))',
  paddingRight: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-right))',
  maxWidth: 560,
  margin: '0 auto',
  minHeight: '60vh',
  boxSizing: 'border-box',
};

const SheetToken = () => {
  const [leaderId, setLeaderId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const urlInputRef = useRef(null);

  const handleIssue = async () => {
    const id = leaderId.trim();
    const num = id ? Number(id) : NaN;
    if (!Number.isInteger(num) || num < 1) {
      setError('올바른 대표 ID(숫자)를 입력하세요.');
      setResult(null);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const token = await createSheetLinkTokenApi({ leaderId: num });
      const url = `${window.location.origin}/api/fetchSheetForLeaderByToken?t=${encodeURIComponent(token)}`;
      setResult({ token, url });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '토큰 발급에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  };

  const copyUrl = async () => {
    if (!result?.url) return;
    const ok = await copyTextToClipboard(result.url);
    showToast(ok ? 'URL이 복사되었습니다.' : '복사에 실패했습니다.');
  };

  return (
    <div style={pageStyle}>
      <h1
        style={{
          margin: '0 0 8px',
          fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
          fontWeight: 600,
          color: '#333',
        }}
      >
        대표트리 공유 링크 발급
      </h1>
      <p
        style={{
          margin: '0 0 20px',
          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
          color: '#666',
        }}
      >
        대표 ID를 입력하면 API URL(JSON 데이터 조회용)을 발급합니다. 앱스크립트 등에서 이 URL로 요청하면 됩니다.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="sheet-token-leader-id" style={{ fontWeight: 600, color: '#333' }}>
          대표 ID
        </label>
        <input
          id="sheet-token-leader-id"
          type="number"
          min={1}
          value={leaderId}
          onChange={(e) => setLeaderId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleIssue()}
          placeholder="예: 181"
          style={{
            width: 120,
            padding: '10px 12px',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleIssue}
          disabled={loading}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#aaa' : '#2f6fed',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
          }}
        >
          {loading ? '발급 중...' : '토큰 발급'}
        </button>
      </div>

      {error && (
        <p
          style={{
            margin: '16px 0 0',
            fontSize: '0.9rem',
            color: 'crimson',
          }}
        >
          {error}
        </p>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 12,
            background: '#f9f9f9',
          }}
        >
          <div style={{ marginBottom: 12, fontWeight: 600, color: '#333' }}>
            API URL (fetchSheetForLeaderByToken)
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={urlInputRef}
              type="text"
              readOnly
              value={result.url}
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                padding: '10px 12px',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                boxSizing: 'border-box',
              }}
              aria-label="API URL"
            />
            <button
              type="button"
              onClick={copyUrl}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #2f6fed',
                background: '#fff',
                color: '#2f6fed',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              API URL 복사
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            background: 'rgba(17, 24, 39, 0.92)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 999,
            fontSize: '0.9rem',
            zIndex: 9999,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default SheetToken;
