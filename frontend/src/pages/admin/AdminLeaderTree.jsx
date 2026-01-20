import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderNodeApi } from '../../apis/admin/adminApi.js';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { useRef } from 'react';
import * as XLSX from 'xlsx';

const AdminLeaderTree = () => {
  const { leaderId } = useParams();
  const nodeRefs = useRef({});

  const { data, isLoading } = useQuery({
    queryKey: ['leaderTree', leaderId], // ✅ leaderId 포함
    queryFn: () => fetchLeaderNodeApi({ leaderId }),
  });

  const handleDownloadTreeExcel = () => {
    if (!data) return;

    const maxDepth = getMaxDepth(data);       // root=0 기준이면 +1 해서 컬럼 개수
    const levelCols = maxDepth + 1;

    // 헤더: id + 레벨열 + 지역/전화/누적인원/권리당원여부
    const header = ['id'];
    for (let i = 1; i <= levelCols; i++) {
      if (i === 1) header.push('대표');
      else header.push('추천인' + (i - 1));
    }
    header.push('지역', '전화번호', '누적인원', '권리당원여부');

    // rows (AOA)
    const outRows = [];
    traverse(data, [], levelCols, outRows);

    // 시트 생성 (AOA -> sheet)
    const ws = XLSX.utils.aoa_to_sheet([header, ...outRows]);

    // (선택) 간단한 열너비
    ws['!cols'] = [
      { wch: 10 }, // id
      ...Array.from({ length: levelCols }, () => ({ wch: 14 })), // 대표/추천인들
      { wch: 28 }, // 지역
      { wch: 16 }, // 전화번호
      { wch: 10 }, // 누적인원
      { wch: 12 }, // 권리당원여부
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '대표트리');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const leaderName = (data?.name ?? '대표').replace(/[\\/:*?"<>|]/g, '_');
    const filename = `대표트리_${leaderName}_${yyyy}${mm}${dd}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
      <>
        {data && (
            <div style={{ marginTop: '35px', marginLeft: '45px' }}>
              {/* ✅ 다운로드 버튼 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{data.name} 트리</div>
                <button
                    onClick={handleDownloadTreeExcel}
                    disabled={isLoading}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      background: isLoading ? '#eee' : '#2f6fed',
                      color: isLoading ? '#888' : '#fff',
                      fontWeight: 800,
                    }}
                >
                  엑셀 다운로드
                </button>
              </div>

              <Xwrapper>
                <TreeNode node={data} refs={nodeRefs.current} />
              </Xwrapper>
            </div>
        )}
      </>
  );
};

/** ✅ depth 최댓값 (node.depth가 없으면 트리 깊이로 계산) */
function getMaxDepth(node, depth = 0) {
  const children = node.children || [];
  let max = typeof node.depth === 'number' ? node.depth : depth;
  for (const c of children) {
    const nextDepth = typeof c.depth === 'number' ? c.depth : depth + 1;
    const d = getMaxDepth(c, nextDepth);
    if (d > max) max = d;
  }
  return max;
}

/** ✅ 트리 펼치기: [id, 레벨열..., 지역, 전화, 누적인원, 권리당원여부] */
function traverse(node, ancestors, levelCols, outRows) {
  const path = ancestors.concat(node.name || '');
  const levelArr = Array(levelCols).fill('');
  for (let i = 0; i < path.length && i < levelCols; i++) {
    levelArr[i] = path[i];
  }

  const total = (typeof node.totalDescendantCount === 'number')
      ? node.totalDescendantCount + 1
      : '';

  const row = [
    node.id ?? '',
    ...levelArr,
    node.address ?? '',
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

// ====== 너의 TreeNode는 그대로 사용 ======
const TreeNode = ({ node, refs }) => {
  const navigate = useNavigate();
  return (
      <div style={{ display: 'flex' }}>
        <div
            id={`node-${node.id}`}
            ref={(el) => { if (el) refs[`node-${node.id}`] = el; }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '169px',
              height: '70px',
              border: '1px solid #000',
              borderRadius: '5px',
              fontSize: '20px',
              fontWeight: 'semibold',
              marginBottom: '15px',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/modifyInfo/${node.id}`)}
        >
          {node.name}
          <span style={{ fontSize: '18px', color: '#838383' }}>
          {(node.phone ?? '').slice(9)}
            <span style={{ marginLeft: '5px', color: '#2DB384' }}>
            ({node.totalDescendantCount})
          </span>
        </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '50px' }}>
          {node.children?.map((child) => (
              <div key={child.id}>
                <TreeNode node={child} refs={refs} />
                <Xarrow
                    start={`node-${node.id}`}
                    end={`node-${child.id}`}
                    startAnchor={{ position: 'right', offset: { x: 0 } }}
                    endAnchor={{ position: 'left', offset: { x: 0 } }}
                    color="black"
                    strokeWidth={1}
                    path="grid"
                />
              </div>
          ))}
        </div>
      </div>
  );
};

export default AdminLeaderTree;