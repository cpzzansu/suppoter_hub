import React, { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {fetchModifyInfoApi, fetchRegion, fetchRegionExcel} from '../../apis/admin/adminApi.js';
import { modifyForm } from '../../apis/form/formApi.js';
import * as XLSX from 'xlsx';

const REGIONS = ['전체','미적용','전주','군산','익산','완주','김제','남원','정읍','고창','무주','진안','임실','부안','장수','순창'];
const APPLIED_REGION_KEYWORDS = ['전주','군산','익산','완주','김제','남원','정읍','고창','무주','진안','임실','부안','장수','순창'];

const Region = () => {
  const queryClient = useQueryClient();
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);     // ✅ 0-based
  const [size, setSize] = useState(20);
  const [regionApplyTarget, setRegionApplyTarget] = useState(null);
  const isUnappliedTab = selectedRegion === '미적용';
  const requestRegion = isUnappliedTab ? '전체' : selectedRegion;

  // ✅ region/keyword 바뀌면 첫 페이지로
  useEffect(() => { setPage(0); }, [selectedRegion, keyword]);

  const {
    data,
    isLoading: regionLoading,
    isError: regionError,
    error: regionErrorObj,
  } = useQuery({
    queryKey: ['region', selectedRegion, keyword, page, size],
    queryFn: () => fetchRegion({
      region: requestRegion,
      keyword,
      page,
      size,
    }),
    enabled: !isUnappliedTab,
    keepPreviousData: true,
  });

  const {
    data: unappliedAllData,
    isLoading: unappliedLoading,
    isError: unappliedError,
    error: unappliedErrorObj,
  } = useQuery({
    queryKey: ['region-unapplied-all', keyword],
    queryFn: async () => {
      const res = await fetchRegionExcel({ region: '전체', keyword });
      const list = res?.data ?? [];
      return list.filter((row) => {
        const addr = String(row?.address ?? '').trim();
        if (!addr) return true;
        return !APPLIED_REGION_KEYWORDS.some((regionName) => addr.includes(regionName));
      });
    },
    enabled: isUnappliedTab,
    keepPreviousData: true,
  });

  // ✅ 일반 탭: 서버 Page 응답 대응
  const pageObj = data?.data ?? data; // axios면 data.data, 아니면 data
  const serverRows = useMemo(() => pageObj?.content ?? [], [pageObj]);

  // ✅ 미적용 탭: 전체 데이터를 프론트에서 필터 후 로컬 페이징
  const unappliedRows = useMemo(() => {
    const all = unappliedAllData ?? [];
    const start = page * size;
    return all.slice(start, start + size);
  }, [unappliedAllData, page, size]);

  const rows = isUnappliedTab ? unappliedRows : serverRows;
  const totalElements = isUnappliedTab ? (unappliedAllData?.length ?? 0) : (pageObj?.totalElements ?? 0);
  const totalPages = isUnappliedTab
    ? Math.max(1, Math.ceil((unappliedAllData?.length ?? 0) / size))
    : (pageObj?.totalPages ?? 0);
  const isLoading = isUnappliedTab ? unappliedLoading : regionLoading;
  const isError = isUnappliedTab ? unappliedError : regionError;
  const error = isUnappliedTab ? unappliedErrorObj : regionErrorObj;

  const canDownload = !isLoading && !isError && rows.length > 0;

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, address }) => {
      const detail = await fetchModifyInfoApi({ id });
      const formData = {
        id: detail.id,
        name: detail.name ?? '',
        phone: detail.phone ?? '',
        address,
        recommend: detail.recommend ?? '대표',
        isRightsMember: detail.isRightsMember ?? false,
      };
      await modifyForm({ formData });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['region'] }),
        queryClient.invalidateQueries({ queryKey: ['region-unapplied-all'] }),
      ]);
      setRegionApplyTarget(null);
      alert('주소가 수정되었습니다.');
    },
    onError: () => {
      alert('주소 수정에 실패했습니다.');
    },
  });

  const buildAddressWithRegion = (regionName, address) => {
    const raw = String(address ?? '').trim();
    const withoutLeadingRegion = APPLIED_REGION_KEYWORDS.reduce((acc, name) => {
      return acc.startsWith(name) ? acc.slice(name.length).trim() : acc;
    }, raw);
    return withoutLeadingRegion ? `${regionName} ${withoutLeadingRegion}` : regionName;
  };

  const handlePickRegion = (row, regionName) => {
    if (!row?.id) return;
    const nextAddress = buildAddressWithRegion(regionName, row.address);
    updateAddressMutation.mutate({ id: row.id, address: nextAddress });
  };

  const handleDownloadExcel = async () => {
    const list = isUnappliedTab
      ? (unappliedAllData ?? [])
      : ((await fetchRegionExcel({ region: requestRegion, keyword }))?.data ?? []);

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
                      <React.Fragment key={`${r.id ?? ''}-${page}-${idx}`}>
                        <tr>
                          <td style={td}>{page * size + idx + 1}</td>
                          <td style={td}>
                            <button
                              type="button"
                              onClick={() => setRegionApplyTarget(r)}
                              disabled={updateAddressMutation.isPending}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#2f6fed',
                                cursor: updateAddressMutation.isPending ? 'not-allowed' : 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                                fontSize: '14px',
                              }}
                            >
                              {r.name ?? ''}
                            </button>
                          </td>

                          {Array.from({ length: maxDepth }).map((_, i) => (
                              <td key={i} style={td}>
                                {r.recommenderPath?.[i] ?? '-'}
                              </td>
                          ))}

                          <td style={td}>{r.phone ?? ''}</td>
                          <td style={{ ...td, textAlign: 'left' }}>{r.address ?? ''}</td>
                        </tr>
                        {regionApplyTarget?.id === r.id && (
                          <tr>
                            <td style={{ ...td, textAlign: 'left' }} colSpan={5 + maxDepth}>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {APPLIED_REGION_KEYWORDS.map((regionName) => (
                                  <button
                                    key={`${r.id}-${regionName}`}
                                    type="button"
                                    onClick={() => handlePickRegion(r, regionName)}
                                    disabled={updateAddressMutation.isPending}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: 8,
                                      border: '1px solid #00B887',
                                      background: '#fff',
                                      color: '#00B887',
                                      cursor: updateAddressMutation.isPending ? 'not-allowed' : 'pointer',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {regionName}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setRegionApplyTarget(null)}
                                  disabled={updateAddressMutation.isPending}
                                  style={{
                                    marginLeft: 8,
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    border: '1px solid #ddd',
                                    background: '#fff',
                                    color: '#666',
                                    cursor: updateAddressMutation.isPending ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  닫기
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
