import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { fetchSheetForLeaderByTokenApi } from '../apis/admin/adminApi.js';

function getMaxDepth(node) {
  let max = typeof node.depth === 'number' ? node.depth : 0;
  const children = node.children || [];
  for (const c of children) {
    const d = getMaxDepth(c);
    if (d > max) max = d;
  }
  return max;
}

function traverse(node, ancestors, levelCols, outRows) {
  const path = ancestors.concat(node.name || '');
  const levelArr = Array(levelCols).fill('');
  for (let i = 0; i < path.length && i < levelCols; i++) {
    levelArr[i] = path[i];
  }

  const total =
    typeof node.totalDescendantCount === 'number'
      ? node.totalDescendantCount + 1
      : '';

  const row = [
    node.id ?? '',
    ...levelArr,
    formatRegion(node.address),
    node.phone ?? '',
    total,
    toYN(node.isRightsMember),
  ];
  outRows.push(row);

  const children = node.children || [];
  for (const c of children) {
    traverse(c, path, levelCols, outRows);
  }
}

function toYN(v) {
  if (v === true || v === 'true' || v === 1 || v === '1') return '유';
  return '무';
}

function formatRegion(addr) {
  if (addr == null || typeof addr !== 'string') return '';
  const s = addr.trim();
  if (!s) return '';
  const m = s.match(/^(.+?시\s+.+?구)/);
  if (m) return m[1];
  const m2 = s.match(/^(.+?시\s+.+?군)/);
  if (m2) return m2[1];
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return parts.slice(0, 2).join(' ');
  return s;
}

function buildSheetData(list) {
  if (!list?.length) return { header: [], rows: [] };

  let maxDepth = 0;
  for (const tree of list) {
    const d = getMaxDepth(tree);
    if (d > maxDepth) maxDepth = d;
  }
  const levelCols = maxDepth + 1;

  const rows = [];
  for (const tree of list) {
    traverse(tree, [], levelCols, rows);
  }

  const header = ['id'];
  for (let i = 1; i <= levelCols; i++) {
    header.push(i === 1 ? '이름' : '추천인' + (i - 1));
  }
  header.push('지역', '전화번호', '누적인원', '권리당원여부');

  return { header, rows };
}

const pageStyle = {
  padding: 'clamp(12px, 4vw, 24px)',
  paddingLeft: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-left))',
  paddingRight: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-right))',
  paddingBottom: 'max(clamp(12px, 4vw, 24px), env(safe-area-inset-bottom))',
  maxWidth: 1200,
  margin: '0 auto',
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: 'clamp(1.1rem, 4.5vw, 1.35rem)',
  fontWeight: 600,
  marginBottom: 'clamp(12px, 3vw, 20px)',
  color: '#333',
};

const scrollWrapStyle = {
  overflowX: 'auto',
  overflowY: 'visible',
  WebkitOverflowScrolling: 'touch',
  marginLeft: 'max(-12px, calc(-1 * env(safe-area-inset-left)))',
  marginRight: 'max(-12px, calc(-1 * env(safe-area-inset-right)))',
  paddingLeft: 'max(12px, env(safe-area-inset-left))',
  paddingRight: 'max(12px, env(safe-area-inset-right))',
};

const tableHeaderStyle = {
  textAlign: 'center',
  padding: 'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 12px)',
  borderBottom: '1px solid #ddd',
  background: '#f5f5f5',
  fontWeight: 700,
  fontSize: 'clamp(0.7rem, 2.2vw, 0.875rem)',
  whiteSpace: 'nowrap',
};

const tableCellStyle = {
  textAlign: 'center',
  padding: 'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 12px)',
  borderBottom: '1px solid #eee',
  fontSize: 'clamp(0.7rem, 2.2vw, 0.875rem)',
  whiteSpace: 'nowrap',
};

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#2f6fed',
  color: '#fff',
  fontWeight: 600,
  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const LeaderSheet = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sheetForLeaderByToken', token],
    queryFn: () => fetchSheetForLeaderByTokenApi({ token }),
    enabled: !!token,
  });

  if (!token) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(0.95rem, 3vw, 1rem)',
            color: '#666',
            textAlign: 'center',
          }}
        >
          유효한 공유 링크가 아닙니다.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(0.85rem, 2.5vw, 0.9rem)',
            color: '#888',
            textAlign: 'center',
          }}
        >
          관리자 화면에서 “URL 복사”로 생성된 링크를 사용하세요.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 'clamp(0.95rem, 3vw, 1rem)', color: '#555' }}>
          대표트리 불러오는 중...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(0.9rem, 2.8vw, 1rem)',
            color: 'crimson',
            textAlign: 'center',
          }}
        >
          조회 실패: {error?.message ?? 'unknown error'}
        </p>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];
  const { header, rows } = buildSheetData(list);

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const levelCols = Math.max(1, header.length - 5); // id(1) + 레벨열 + 지역/전화/누적/권리(4)
    ws['!cols'] = [
      { wch: 10 },
      ...Array.from({ length: levelCols }, () => ({ wch: 14 })),
      { wch: 28 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '대표트리');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    XLSX.writeFile(wb, `대표트리_${yyyy}${mm}${dd}.xlsx`);
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ ...titleStyle, marginTop: 0, marginBottom: 0 }}>
          대표트리
        </h1>
        <button
          type='button'
          style={buttonStyle}
          onClick={handleDownloadExcel}
          disabled={rows.length === 0}
        >
          엑셀 다운로드
        </button>
      </div>
      <div style={scrollWrapStyle}>
        <table
          style={{
            width: '100%',
            minWidth: 320,
            borderCollapse: 'collapse',
            border: '1px solid #ddd',
          }}
        >
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i} style={tableHeaderStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  style={{ ...tableCellStyle, textAlign: 'center' }}
                  colSpan={header.length}
                >
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, j) => (
                    <td key={j} style={tableCellStyle}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderSheet;
