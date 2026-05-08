import { useQuery } from '@tanstack/react-query';
import { fetchDeletionLog } from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

const DeletionLog = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['deletionLog'],
    queryFn: fetchDeletionLog,
  });

  const rows = data ?? [];

  const handleDownloadExcel = () => {
    const excelRows = rows.map((r) => ({
      원본ID: r.originalId ?? '',
      이름: r.name ?? '',
      전화번호: r.phone ?? '',
      주소: r.address ?? '',
      추천구분: r.recommend ?? '',
      추천인: r.recommenderName ?? '',
      권리당원: r.isRightsMember ? '예' : '아니오',
      가입일시: r.originalCreatedAt ?? '',
      삭제일시: r.deletedAt ?? '',
      삭제자: r.deletedBy ?? '',
      삭제사유: r.reason ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '삭제기록');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    XLSX.writeFile(wb, `서포터_삭제기록_${yyyy}${mm}${dd}.xlsx`);
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '20px' }}>
        서포터 삭제 기록
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <span style={{ fontSize: '16px', color: '#555' }}>
          총 {rows.length}건
        </span>
        <button
          onClick={handleDownloadExcel}
          disabled={isLoading || isError || rows.length === 0}
          style={{
            padding: '8px 20px',
            backgroundColor: rows.length === 0 ? '#ccc' : '#2DB384',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          엑셀 다운로드
        </button>
      </div>

      {isLoading && <div>로딩 중...</div>}
      {isError && <div style={{ color: 'red' }}>데이터를 불러오지 못했습니다.</div>}

      {!isLoading && !isError && (
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {['원본ID', '이름', '전화번호', '주소', '추천구분', '추천인', '권리당원', '가입일시', '삭제일시', '삭제자', '삭제사유'].map((h) => (
                <th key={h} style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>삭제 기록이 없습니다.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.originalId}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.phone}</td>
                  <td style={td}>{r.address}</td>
                  <td style={td}>{r.recommend}</td>
                  <td style={td}>{r.recommenderName}</td>
                  <td style={td}>{r.isRightsMember ? '예' : '아니오'}</td>
                  <td style={td}>{r.originalCreatedAt}</td>
                  <td style={td}>{r.deletedAt}</td>
                  <td style={td}>{r.deletedBy}</td>
                  <td style={td}>{r.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const td = { border: '1px solid #ddd', padding: '7px 12px' };

export default DeletionLog;
