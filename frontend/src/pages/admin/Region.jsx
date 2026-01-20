import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {fetchRegion, fetchRegionExcel} from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

const REGIONS = ['전체','전주','군산','익산','완주','김제','남원','정읍','고창','무주','진안','임실','부안','장수','순창'];

const Region = () => {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);     // ✅ 0-based
  const [size, setSize] = useState(20);

  // ✅ region/keyword 바뀌면 첫 페이지로
  useEffect(() => { setPage(0); }, [selectedRegion, keyword]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['region', selectedRegion, keyword, page, size],
    queryFn: () => fetchRegion({ region: selectedRegion, keyword, page, size }),
    keepPreviousData: true,
  });



  // ✅ Page 응답 대응
  const pageObj = data?.data ?? data; // axios면 data.data, 아니면 data
  const rows = useMemo(() => pageObj?.content ?? [], [pageObj]);

  const totalElements = pageObj?.totalElements ?? 0;
  const totalPages = pageObj?.totalPages ?? 0;

  const canDownload = !isLoading && !isError && rows.length > 0;

  const handleDownloadExcel = async () => {
    const res = await fetchRegionExcel({ region: selectedRegion, keyword });
    const list = res?.data ?? [];

    // ✅ 서버가 전체 명단을 id, name, phone, address, recommenderName 형태로 준다고 가정
    const excelRows = list.map((r) => ({
      id: r.id ?? '',
      이름: r.name ?? '',
      전화번호: r.phone ?? '',
      주소: r.address ?? '',
      추천자이름: r.recommenderName ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedRegion);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const filename = `지역서포터즈_${selectedRegion}_${keyword ? `검색-${keyword}_` : ''}${yyyy}${mm}${dd}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const gotoPrev = () => setPage((p) => Math.max(0, p - 1));
  const gotoNext = () => setPage((p) => (totalPages ? Math.min(totalPages - 1, p + 1) : p));

  const maxDepth = useMemo(() => {
    return rows.reduce((m, r) => Math.max(m, (r.recommenderPath?.length ?? 0)), 0);
  }, [rows]);

  return (
      <div>
        <div style={{ fontSize: '4vw', fontWeight: 800, paddingLeft: '3vw', paddingTop: '2vw' }}>
          지역 서포터즈 데이터
        </div>

        {/* ✅ 검색바 */}
        <div style={{ paddingLeft: '3vw', paddingTop: '1vw', display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="이름 또는 전화번호 검색"
              style={{
                width: 320,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                outline: 'none',
              }}
          />
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ padding: '10px 12px', borderRadius: 10 }}>
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>

          <div style={{ marginLeft: 'auto', fontWeight: 800, opacity: 0.8 }}>
            총 {totalElements}명
          </div>

          <button
              onClick={handleDownloadExcel}
              disabled={!canDownload}
              style={{
                marginRight: '3vw',
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

        {/* ✅ 지역 버튼 */}
        <div style={{ paddingLeft: '3vw', paddingTop: '1vw', display: 'flex', gap: '0.5vw', flexWrap: 'wrap', alignItems: 'center' }}>
          {REGIONS.map((region) => (
              <RegionButton
                  key={region}
                  label={region}
                  active={selectedRegion === region}
                  onClick={() => setSelectedRegion(region)}
              />
          ))}
        </div>

        {/* ✅ 페이징 */}
        <div style={{ paddingLeft: '3vw', paddingTop: '1vw', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={gotoPrev} disabled={page === 0} style={pagerBtn(page === 0)}>이전</button>
          <div style={{ fontWeight: 800 }}>
            {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </div>
          <button onClick={gotoNext} disabled={totalPages === 0 || page >= totalPages - 1} style={pagerBtn(totalPages === 0 || page >= totalPages - 1)}>다음</button>
        </div>

        {/* ✅ 테이블 */}
        <div style={{ padding: 16, width: '94%', paddingLeft: '3vw' }}>
          {isLoading && <div style={{ padding: '1vw' }}>불러오는 중...</div>}
          {isError && <div style={{ padding: '1vw', color: 'crimson' }}>조회 실패: {error?.message ?? 'unknown error'}</div>}

          {!isLoading && !isError && (
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                <thead>
                <tr>
                  <th style={th}>No</th>
                  <th style={th}>이름</th>

                  {Array.from({ length: maxDepth }).map((_, i) => (
                      <th key={i} style={th}>{`추천자${i + 1}`}</th>
                  ))}

                  <th style={th}>전화번호</th>
                  <th style={th}>주소</th>
                </tr>
                </thead>

                <tbody>
                {rows.length === 0 ? (
                    <tr><td style={td} colSpan={5 + maxDepth}>데이터가 없습니다.</td></tr>
                ) : (
                    rows.map((r, idx) => (
                        <tr key={`${r.id ?? ''}-${page}-${idx}`}>
                          <td style={td}>{page * size + idx + 1}</td>
                          <td style={td}>{r.name ?? ''}</td>

                          {Array.from({ length: maxDepth }).map((_, i) => (
                              <td key={i} style={td}>
                                {r.recommenderPath?.[i] ?? '-'}
                              </td>
                          ))}

                          <td style={td}>{r.phone ?? ''}</td>
                          <td style={{ ...td, textAlign: 'left' }}>{r.address ?? ''}</td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
          )}
        </div>
      </div>
  );
};

const pagerBtn = (disabled) => ({
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #ddd',
  background: disabled ? '#eee' : '#fff',
  color: disabled ? '#999' : '#222',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 800,
});

const RegionButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          cursor: 'pointer',
          border: active ? '2px solid #0a7a5a' : '1px solid #00B887',
          backgroundColor: active ? '#00B887' : '#fff',
          color: active ? '#fff' : '#00B887',
          fontWeight: active ? 700 : 600,
        }}
    >
      {label}
    </button>
);

const th = { textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #ddd', background: '#f7f7f7', fontWeight: 800, fontSize: 14 };
const td = { textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 14 };

export default Region;