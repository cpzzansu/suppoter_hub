import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchDirectChildrenRanking,
  fetchLeaderNodeApi,
} from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

function toYN(v) {
  if (v === true || v === 'true' || v === 1 || v === '1') return '유';
  return '무';
}

function sanitizeFileName(name) {
  return String(name ?? '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'unknown';
}

const RANKING_CONTENT_WIDTH = 640;

const DirectChildrenRanking = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['directChildrenRanking', { includePath: false }],
    queryFn: () => fetchDirectChildrenRanking({ includePath: false }),
  });

  const rows = Array.isArray(data) ? data : (data?.data ?? []);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : RANKING_CONTENT_WIDTH,
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const paddingPx = 32;
  const availableWidth = viewportWidth - paddingPx;
  const scale =
    availableWidth < RANKING_CONTENT_WIDTH
      ? Math.max(0.3, availableWidth / RANKING_CONTENT_WIDTH)
      : 1;

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1600);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const canDownload = !isLoading && !isError && rows.length > 0;

  const handleDownloadExcel = async () => {
    const allWithPath = await fetchDirectChildrenRanking({ includePath: true });
    const list = Array.isArray(allWithPath)
      ? allWithPath
      : (allWithPath?.data ?? []);

    const excelMaxDepth = list.reduce(
      (m, r) => Math.max(m, r.recommenderPath?.length ?? 0),
      0,
    );

    const excelRows = list.map((r, idx) => {
      const row = {
        순위: r.ranking ?? r.rank ?? idx + 1,
        이름: r.name ?? '',
      };
      Array.from({ length: excelMaxDepth }).forEach((_, i) => {
        row[`추천자${i + 1}`] = r.recommenderPath?.[i] ?? '-';
      });
      row['직계자손수'] = r.recommendedCount ?? '';
      row['전화번호'] = r.phone ?? '';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '직계자손랭킹');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    XLSX.writeFile(wb, `직계자손랭킹_${yyyy}${mm}${dd}.xlsx`);
  };

  const handleDownloadDirectChildrenExcel = async (leader) => {
    try {
      const root = await fetchLeaderNodeApi({ leaderId: leader.id });
      const directChildren = Array.isArray(root?.children) ? root.children : [];

      if (directChildren.length === 0) {
        showToast('직계자손이 없습니다.');
        return;
      }

      const excelRows = directChildren.map((c, idx) => ({
        번호: idx + 1,
        이름: c.name ?? '',
        전화번호: c.phone ?? '',
        주소: c.address ?? '',
        권리당원여부: toYN(c.isRightsMember),
      }));

      const ws = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '직계자손명단');

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const leaderName = sanitizeFileName(leader?.name);
      XLSX.writeFile(wb, `직계자손명단_${leaderName}_${yyyy}${mm}${dd}.xlsx`);
    } catch {
      showToast('직계자손 명단 다운로드에 실패했습니다.');
    }
  };

  return (
    <div
      style={{
        padding: 'clamp(12px, 4vw, 24px)',
        paddingLeft: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-left))',
        paddingRight: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-right))',
        paddingBottom:
          'max(clamp(12px, 4vw, 24px), env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          width: RANKING_CONTENT_WIDTH * scale,
          margin: '0 auto',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            width: RANKING_CONTENT_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)',
                fontWeight: 600,
                color: '#333',
                textAlign: 'center',
              }}
            >
              직계자손 랭킹
            </h1>
          </div>

          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#555',
                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                lineHeight: 1.4,
              }}
            >
              직계자손(직접 추천한 사람) 10명 이상인 사람만 표시 · 현재 인원:{' '}
              <b>{rows.length}</b>명
            </div>

            <button
              onClick={handleDownloadExcel}
              disabled={!canDownload}
              style={{
                padding: '12px 16px',
                minHeight: 44,
                borderRadius: 10,
                border: '1px solid #ddd',
                cursor: canDownload ? 'pointer' : 'not-allowed',
                background: canDownload ? '#2f6fed' : '#eee',
                color: canDownload ? '#fff' : '#888',
                fontWeight: 700,
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              }}
            >
              엑셀 다운로드
            </button>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 clamp(8px, 2vw, 16px)',
            }}
          >
            {isLoading && (
              <div
                style={{
                  padding: 'clamp(12px, 4vw, 24px)',
                  textAlign: 'center',
                  color: '#555',
                }}
              >
                불러오는 중...
              </div>
            )}
            {isError && (
              <div
                style={{
                  padding: 'clamp(12px, 4vw, 24px)',
                  color: 'crimson',
                  textAlign: 'center',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                }}
              >
                랭킹 조회 실패: {error?.message ?? 'unknown error'}
              </div>
            )}

            {!isLoading && !isError && (
              <div
                style={{
                  borderRadius: 8,
                  border: '1px solid #ddd',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 580,
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      <th style={th}>순위</th>
                      <th style={th}>이름</th>
                      <th style={th}>대표이름</th>
                      <th style={th}>직계자손수</th>
                      <th style={th}>전화번호</th>
                      <th style={th}>직계자손 명단</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td style={td} colSpan={6}>
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => (
                        <tr
                          key={`${r.ranking ?? r.rank ?? idx}-${r.name ?? ''}`}
                        >
                          <td style={td}>{r.ranking ?? r.rank ?? idx + 1}</td>
                          <td style={td}>{r.name}</td>
                          <td style={td}>{r.rootName}</td>
                          <td style={td}>{r.recommendedCount}</td>
                          <td style={td}>{r.phone}</td>
                          <td style={td}>
                            {r.id ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadDirectChildrenExcel(r)}
                                style={urlCopyButtonStyle}
                              >
                                엑셀 다운로드
                              </button>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

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
            fontSize: 'clamp(0.8rem, 2.4vw, 0.95rem)',
            lineHeight: 1.2,
            zIndex: 9999,
            maxWidth: 'min(92vw, 520px)',
            textAlign: 'center',
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

const th = {
  textAlign: 'center',
  padding: 'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 12px)',
  borderBottom: '1px solid #ddd',
  background: '#f7f7f7',
  fontWeight: 700,
  fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
  whiteSpace: 'nowrap',
};

const td = {
  textAlign: 'center',
  padding: 'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 12px)',
  borderBottom: '1px solid #eee',
  fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
  whiteSpace: 'nowrap',
};

const urlCopyButtonStyle = {
  padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)',
  minHeight: 44,
  borderRadius: 8,
  border: '1px solid #2f6fed',
  cursor: 'pointer',
  background: '#fff',
  color: '#2f6fed',
  fontWeight: 600,
  fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)',
};

export default DirectChildrenRanking;
