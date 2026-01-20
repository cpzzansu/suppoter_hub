import { useQuery } from '@tanstack/react-query';
import { fetchRecommendMissingApi } from '../../apis/admin/adminApi.js';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const REGIONS = [
  '전체',
  '전주',
  '군산',
  '익산',
  '완주',
  '김제',
  '남원',
  '정읍',
  '고창',
  '무주',
  '진안',
  '임실',
  '부안',
  '장수',
  '순창',
];

const AdminRecommendMissing = () => {
  const navigate = useNavigate();

  // ✅ 기본값: 전체
  const [dataFilter, setDataFilter] = useState('전체');

  const collator = new Intl.Collator('ko-KR', {
    sensitivity: 'base',
    numeric: true,
  });

  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: ['recommendMissing'],
    queryFn: fetchRecommendMissingApi,
  });

  // ✅ 정렬 + 지역 필터(전체면 필터 X)
  const data = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const ax = (a.recommend ?? '').trim();
      const bx = (b.recommend ?? '').trim();

      if (!ax && !bx) return 0;
      if (!ax) return 1;
      if (!bx) return -1;

      const byRecommend = collator.compare(ax, bx);
      return byRecommend !== 0
          ? byRecommend
          : collator.compare(a.name ?? '', b.name ?? '');
    });

    if (!dataFilter || dataFilter === '전체') return sorted;

    return sorted.filter((row) => (row.address ?? '').includes(dataFilter));
  }, [rows, dataFilter, collator]);

  const canDownload = !isLoading && !isError && data.length > 0;

  const handleDownloadExcel = () => {
    const excelRows = data.map((r, idx) => ({
      No: idx + 1,
      이름: r.name ?? '',
      추천자입력값: (r.recommend ?? '').trim(),
      전화번호: r.phone ?? '',
      주소: r.address ?? '',
      id: r.id ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();

    const sheetName = dataFilter || '전체';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const filename = `추천자미적용_${sheetName}_${yyyy}${mm}${dd}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
      <div>
        {/* 타이틀 */}
        <div
            style={{
              fontSize: '4vw',
              fontWeight: 800,
              paddingLeft: '3vw',
              paddingTop: '2vw',
            }}
        >
          추천자 미적용 데이터
        </div>

        {/* 탭 + 요약 + 다운로드 */}
        <div
            style={{
              paddingLeft: '3vw',
              paddingTop: '2vw',
              display: 'flex',
              gap: '0.5vw',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
        >
          {REGIONS.map((region) => (
              <TabButton
                  key={region}
                  label={region}
                  active={dataFilter === region}
                  onClick={() => setDataFilter(region)}
              />
          ))}

          {/* 오른쪽: 전체/현재필터 인원 + 다운로드 버튼 */}
          <div
              style={{
                marginLeft: 'auto',
                marginRight: '3vw',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
          >
            <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f7f7f7',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
            >
              <span style={{ opacity: 0.7 }}>선택</span>
              <b>{dataFilter}</b>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ opacity: 0.7 }}>인원</span>
              <b>{data.length}</b>
              <span style={{ opacity: 0.7 }}>명</span>
            </div>

            <button
                onClick={handleDownloadExcel}
                disabled={!canDownload}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                  cursor: canDownload ? 'pointer' : 'not-allowed',
                  background: canDownload ? '#2f6fed' : '#eee',
                  color: canDownload ? '#fff' : '#888',
                  fontWeight: 800,
                }}
            >
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '30px',
              flexWrap: 'wrap',
              paddingLeft: '10vw',
              paddingRight: '10vw',
            }}
        >
          {isLoading && <div style={{ padding: '1vw' }}>불러오는 중...</div>}
          {isError && (
              <div style={{ padding: '1vw', color: 'crimson' }}>
                조회 실패: {error?.message ?? 'unknown error'}
              </div>
          )}

          {!isLoading &&
              !isError &&
              data.map((missingData) => (
                  <button
                      key={missingData.id}
                      style={{ padding: '1vw', margin: '0.5vw', cursor: 'pointer' }}
                      onClick={() => navigate(`/modifyInfo/${missingData.id}`)}
                  >
                    <div>{missingData.name}</div>
                    <div>추천자: {missingData.recommend}</div>
                  </button>
              ))}
        </div>
      </div>
  );
};

const TabButton = ({ label, active, onClick }) => {
  return (
      <button
          onClick={onClick}
          style={{
            padding: '12px 14px',
            cursor: 'pointer',
            borderRadius: 10,
            border: active ? '2px solid #0a7a5a' : '1px solid #00B887',
            backgroundColor: active ? '#00B887' : '#fff',
            color: active ? '#fff' : '#00B887',
            fontWeight: active ? 700 : 600,
          }}
      >
        {label}
      </button>
  );
};

export default AdminRecommendMissing;