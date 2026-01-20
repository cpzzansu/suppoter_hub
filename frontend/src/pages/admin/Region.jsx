import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRegion } from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

const REGIONS = [
    '전체','전주','군산','익산','완주','김제','남원','정읍','고창','무주','진안','임실','부안','장수','순창',
];

const Region = () => {
    const [selectedRegion, setSelectedRegion] = useState('전체');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['region', selectedRegion], // ✅ region 바뀌면 새로 요청
        queryFn: () => fetchRegion({ region: selectedRegion }),
    });

    // ✅ 응답 형태가 data 또는 data.data 인 케이스 둘 다 처리
    const rows = useMemo(() => {
        const arr = Array.isArray(data) ? data : data?.data;
        return Array.isArray(arr) ? arr : [];
    }, [data]);

    const canDownload = !isLoading && !isError && rows.length > 0;

    const handleDownloadExcel = () => {
        const excelRows = rows.map((r, idx) => ({
            No: idx + 1,
            이름: r.name ?? '',
            추천자: r.recommenderName ?? '',
            전화번호: r.phone ?? '',
            주소: r.address ?? '',
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, selectedRegion);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        const filename = `지역서포터즈_${selectedRegion}_${yyyy}${mm}${dd}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    return (
        <div>
            <div
                style={{
                    fontSize: '4vw',
                    fontWeight: 800,
                    paddingLeft: '3vw',
                    paddingTop: '2vw',
                }}
            >
                지역 서포터즈 데이터
            </div>

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
                    <RegionButton
                        key={region}
                        label={region}
                        active={selectedRegion === region}
                        onClick={() => setSelectedRegion(region)}
                    />
                ))}

                {/* ✅ 선택 요약 배지 */}
                <div
                    style={{
                        marginLeft: 'auto',
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
                    <span style={{ opacity: 0.7, fontWeight: 600 }}>선택</span>
                    <span>{selectedRegion}</span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span style={{ opacity: 0.7, fontWeight: 600 }}>인원</span>
                    <span>{rows.length}</span>
                    <span style={{ opacity: 0.7, fontWeight: 600 }}>명</span>
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

            {/* ✅ 테이블 */}
            <div style={{ padding: 16, width: '94%', paddingLeft: '3vw' }}>
                {isLoading && <div style={{ padding: '1vw' }}>불러오는 중...</div>}
                {isError && (
                    <div style={{ padding: '1vw', color: 'crimson' }}>
                        조회 실패: {error?.message ?? 'unknown error'}
                    </div>
                )}

                {!isLoading && !isError && (
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            border: '1px solid #ddd',
                            background: '#fff',
                            borderRadius: 12,
                            overflow: 'hidden',
                        }}
                    >
                        <thead>
                        <tr>
                            <th style={th}>No</th>
                            <th style={th}>이름</th>
                            <th style={th}>추천자</th>
                            <th style={th}>전화번호</th>
                            <th style={th}>주소</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={5}>
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r, idx) => (
                                <tr key={`${r.phone ?? ''}-${idx}`}>
                                    <td style={td}>{idx + 1}</td>
                                    <td style={td}>{r.name ?? ''}</td>
                                    <td style={td}>{r.recommenderName ?? '-'}</td>
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

const RegionButton = ({ label, active, onClick }) => {
    return (
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
};

const th = {
    textAlign: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #ddd',
    background: '#f7f7f7',
    fontWeight: 800,
    fontSize: 14,
};

const td = {
    textAlign: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #eee',
    fontSize: 14,
};

export default Region;