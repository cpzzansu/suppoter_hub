import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createSheetLinkTokenApi,
  fetchRanking,
} from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

/**
 * iOS Safari는 await 이후 실행되는 복사를 "사용자 제스처"로 인정하지 않아 차단함.
 * 따라서 복사는 반드시 "사용자 탭"과 동기적으로 실행되어야 함.
 * - PC/Android: navigator.clipboard 시도 후 실패 시 모달로 폴백
 * - iOS 대응: "URL 복사" 탭 → URL 모달 표시 → "복사하기" 탭 시 그 탭 핸들러 안에서만 execCommand('copy') 호출
 */
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

/** Web Share API 사용, 실패 시 기존 복사 로직으로 폴백 */
async function shareOrCopyUrl({ url, onCopyFallback }) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '서포터즈 대표트리',
        text: '대표트리 URL을 공유합니다.',
        url,
      });
      return { shared: true, copied: false };
    } catch (err) {
      // 사용자가 공유 창을 닫은 경우는 그대로 종료, 그 외엔 복사 폴백
      if (err?.name === 'AbortError') return { shared: false, copied: false };
    }
  }

  const ok = await copyTextToClipboard(url);
  if (ok) onCopyFallback?.();
  return { shared: false, copied: ok };
}

/** iOS 등에서 복사가 막혀 있을 때, 보이는 input에서 동기적으로 복사 (탭 직후에만 호출) */
function copyFromVisibleInput(inputRef) {
  if (!inputRef?.current) return false;
  const el = inputRef.current;
  el.focus();
  el.select();
  el.setSelectionRange(0, el.value.length);
  return document.execCommand('copy');
}

const LEVELS = [
  { key: 'ALL', label: '전체', min: null, max: null },
  { key: 'ROYAL', label: '로얄패밀리', min: 500, max: null },
  { key: 'BEST_FAMILY', label: '베스트패밀리', min: 250, max: 499 },
  { key: 'FAMILY', label: '패밀리', min: 100, max: 249 },
  { key: 'BEST_FRIEND', label: '베스트프렌드', min: 50, max: 99 },
  { key: 'FRIEND', label: '프렌드', min: 20, max: 49 },
];

/** 화면이 좁을 때 이 너비 기준으로 축소해서 테이블 전체가 보이게 함 */
const RANKING_CONTENT_WIDTH = 640;

const Ranking = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ranking', { includePath: false }],
    queryFn: () => fetchRanking({ includePath: false }),
  });

  const rows = Array.isArray(data) ? data : (data?.data ?? []);

  const [selectedLevelKey, setSelectedLevelKey] = useState('ALL');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  /** iOS 대응: 직접 복사 실패 시 URL을 보여주고 "복사하기" 탭으로 동기 복사 */
  const [pendingCopyUrl, setPendingCopyUrl] = useState(null);
  const copyInputRef = useRef(null);

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

  const maxDepth = useMemo(() => {
    return rows.reduce(
      (m, r) => Math.max(m, r.recommenderPath?.length ?? 0),
      0,
    );
  }, [rows]);

  const selectedLevel = useMemo(
    () => LEVELS.find((l) => l.key === selectedLevelKey) ?? LEVELS[0],
    [selectedLevelKey],
  );

  const filteredRows = useMemo(() => {
    const min = selectedLevel.min;
    const max = selectedLevel.max;

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    return rows.filter((r) => {
      const cnt = toNum(r.recommendedCount);
      if (min == null && max == null) return true; // 전체
      if (min != null && max == null) return cnt >= min; // 이상
      return cnt >= min && cnt <= max; // 구간
    });
  }, [rows, selectedLevel]);

  const canDownload =
    !isLoading &&
    !isError &&
    selectedLevelKey !== 'ALL' &&
    filteredRows.length > 0;

  const handleDownloadExcel = async () => {
    // 엑셀 다운로드는 추천자 경로가 필요하므로 includePath=true로 다시 조회
    const allWithPath = await fetchRanking({ includePath: true });
    const list = Array.isArray(allWithPath)
      ? allWithPath
      : (allWithPath?.data ?? []);

    const min = selectedLevel.min;
    const max = selectedLevel.max;
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const filteredForExcel = list.filter((r) => {
      const cnt = toNum(r.recommendedCount);
      if (min == null && max == null) return true;
      if (min != null && max == null) return cnt >= min;
      return cnt >= min && cnt <= max;
    });

    const excelMaxDepth = filteredForExcel.reduce(
      (m, r) => Math.max(m, r.recommenderPath?.length ?? 0),
      0,
    );

    // 엑셀에 넣을 형태로 가공 (추천자 경로 포함)
    const excelRows = filteredForExcel.map((r, idx) => {
      const row = {
        순위: r.ranking ?? r.rank ?? idx + 1,
        이름: r.name ?? '',
      };

      // 추천자 경로를 동적으로 추가
      Array.from({ length: excelMaxDepth }).forEach((_, i) => {
        row[`추천자${i + 1}`] = r.recommenderPath?.[i] ?? '-';
      });

      row['모집인원'] = r.recommendedCount ?? '';
      row['전화번호'] = r.phone ?? '';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '랭킹');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const levelLabel = selectedLevel.label.replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(wb, `랭킹_${levelLabel}_${yyyy}${mm}${dd}.xlsx`);
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
              서포터즈 랭킹
            </h1>
          </div>

          {/* 레벨 버튼: 모바일에서 가로 스크롤 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 8,
              marginTop: 16,
              marginBottom: 12,
              justifyContent: 'center',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 4,
            }}
          >
            {LEVELS.map((lv) => (
              <LevelButton
                key={lv.key}
                label={lv.label}
                active={selectedLevelKey === lv.key}
                onClick={() => setSelectedLevelKey(lv.key)}
              />
            ))}
          </div>

          {/* 레벨 선택했을 때만 엑셀 다운로드 버튼 노출 */}
          {selectedLevelKey !== 'ALL' && (
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
                현재 필터: <b>{selectedLevel.label}</b> (모집인원{' '}
                {selectedLevel.min}
                {selectedLevel.max == null
                  ? '명 이상'
                  : `~${selectedLevel.max}명`}
                ){'  '}|{'  '}
                현재 인원: <b>{filteredRows.length}</b>명
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
          )}

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
                      <th style={th}>모집인원</th>
                      <th style={th}>전화번호</th>
                      <th style={th}>URL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td style={td} colSpan={6}>
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r, idx) => {
                        return (
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
                                  type='button'
                                  onClick={async () => {
                                    try {
                                      const token =
                                        await createSheetLinkTokenApi({
                                          leaderId: r.id,
                                        });
                                      const url = `${window.location.origin}/sheet?t=${token}`;
                                      const result = await shareOrCopyUrl({
                                        url,
                                        onCopyFallback: () =>
                                          showToast('URL이 복사되었습니다.'),
                                      });
                                      if (result.shared) {
                                        showToast('공유 창을 열었습니다.');
                                      } else if (!result.copied) {
                                        setPendingCopyUrl(url);
                                      }
                                    } catch (e) {
                                      showToast('URL 생성에 실패했습니다.');
                                    }
                                  }}
                                  style={urlCopyButtonStyle}
                                >
                                  공유하기
                                </button>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* iOS 등: 직접 복사가 막혀 있을 때 URL을 보여주고 "복사하기" 탭 시 동기 복사 */}
      {pendingCopyUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          role='dialog'
          aria-label='URL 복사'
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 'clamp(16px, 4vw, 24px)',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(0.95rem, 2.8vw, 1.1rem)',
                fontWeight: 600,
                marginBottom: 8,
                color: '#333',
              }}
            >
              대표트리 URL
            </div>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 'clamp(0.8rem, 2.2vw, 0.875rem)',
                color: '#666',
              }}
            >
              「복사하기」를 누르면 클립보드에 저장됩니다.
            </p>
            <input
              ref={copyInputRef}
              type='text'
              readOnly
              value={pendingCopyUrl}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)',
                border: '1px solid #ddd',
                borderRadius: 8,
                marginBottom: 16,
              }}
              aria-label='복사할 URL'
            />
            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}
            >
              <button
                type='button'
                onClick={() => setPendingCopyUrl(null)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                }}
              >
                닫기
              </button>
              <button
                type='button'
                onClick={() => {
                  const ok = copyFromVisibleInput(copyInputRef);
                  setPendingCopyUrl(null);
                  showToast(
                    ok ? 'URL이 복사되었습니다.' : '복사에 실패했습니다.',
                  );
                }}
                style={{
                  padding: '10px 16px',
                  minHeight: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: '#2f6fed',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                }}
              >
                복사하기
              </button>
            </div>
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
            fontSize: 'clamp(0.8rem, 2.4vw, 0.95rem)',
            lineHeight: 1.2,
            zIndex: 9999,
            maxWidth: 'min(92vw, 520px)',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
          role='status'
          aria-live='polite'
        >
          {toast}
        </div>
      )}
    </div>
  );
};

const LevelButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 14px)',
        minHeight: 44,
        cursor: 'pointer',
        borderRadius: 10,
        border: active ? '2px solid #333' : '1px solid #ddd',
        background: active ? '#333' : '#fff',
        color: active ? '#fff' : '#333',
        fontWeight: active ? 700 : 500,
        fontSize: 'clamp(0.75rem, 2.2vw, 0.875rem)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
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

export default Ranking;
