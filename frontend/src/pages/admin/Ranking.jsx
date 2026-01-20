import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRanking } from '../../apis/admin/adminApi.js';
import * as XLSX from 'xlsx';

const LEVELS = [
    { key: 'ALL', label: '전체', min: null, max: null },
    { key: 'ROYAL', label: '로얄패밀리', min: 500, max: null },
    { key: 'BEST_FAMILY', label: '베스트패밀리', min: 250, max: 499 },
    { key: 'FAMILY', label: '패밀리', min: 100, max: 249 },
    { key: 'BEST_FRIEND', label: '베스트프렌드', min: 50, max: 99 },
    { key: 'FRIEND', label: '프렌드', min: 20, max: 49 },
];

const Ranking = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['ranking'],
        queryFn: fetchRanking,
    });

    const rows = Array.isArray(data) ? data : data?.data ?? [];

    const [selectedLevelKey, setSelectedLevelKey] = useState('ALL');

    const selectedLevel = useMemo(
        () => LEVELS.find((l) => l.key === selectedLevelKey) ?? LEVELS[0],
        [selectedLevelKey]
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

    const canDownload = !isLoading && !isError && selectedLevelKey !== 'ALL' && filteredRows.length > 0;

    const handleDownloadExcel = () => {
        // 엑셀에 넣을 형태로 가공 (필요한 컬럼만)
        const excelRows = filteredRows.map((r, idx) => ({
            순위: r.ranking ?? r.rank ?? idx + 1,
            이름: r.name ?? '',
            대표이름: r.rootName ?? '',
            모집인원: r.recommendedCount ?? 0,
            전화번호: r.phone ?? '',
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, selectedLevel.label);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        const filename = `서포터즈랭킹_${selectedLevel.label}_${yyyy}${mm}${dd}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <div
                style={{
                    fontSize: '4vw',
                    fontWeight: '600',
                    marginTop: '3vw',
                    color: '#333',
                }}
            >
                서포터즈 랭킹
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '30px',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
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

            {/* ✅ 레벨 선택했을 때만 엑셀 다운로드 버튼 노출 */}
            {selectedLevelKey !== 'ALL' && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ color: '#555' }}>
                        현재 필터: <b>{selectedLevel.label}</b>{' '}
                        (모집인원 {selectedLevel.min}
                        {selectedLevel.max == null ? '명 이상' : `~${selectedLevel.max}명`})
                        {'  '}|{'  '}
                        현재 인원: <b>{filteredRows.length}</b>명
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
                            fontWeight: 700,
                        }}
                    >
                        엑셀 다운로드
                    </button>
                </div>
            )}

            <div style={{ padding: 16, width: '90%', maxWidth: 1100 }}>
                {isLoading && <div style={{ padding: '1vw' }}>불러오는 중...</div>}
                {isError && (
                    <div style={{ padding: '1vw', color: 'crimson' }}>
                        랭킹 조회 실패: {error?.message ?? 'unknown error'}
                    </div>
                )}

                {!isLoading && !isError && (
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            border: '1px solid #ddd',
                        }}
                    >
                        <thead>
                        <tr>
                            <th style={th}>순위</th>
                            <th style={th}>이름</th>
                            <th style={th}>대표이름</th>
                            <th style={th}>모집인원</th>
                            <th style={th}>전화번호</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={5}>
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((r, idx) => (
                                <tr key={`${r.ranking ?? r.rank ?? idx}-${r.name ?? ''}`}>
                                    <td style={td}>{r.ranking ?? r.rank ?? idx + 1}</td>
                                    <td style={td}>{r.name}</td>
                                    <td style={td}>{r.rootName}</td>
                                    <td style={td}>{r.recommendedCount}</td>
                                    <td style={td}>{r.phone}</td>
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

const LevelButton = ({ label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderRadius: 10,
                border: active ? '2px solid #333' : '1px solid #ddd',
                background: active ? '#333' : '#fff',
                color: active ? '#fff' : '#333',
                fontWeight: active ? 700 : 500,
            }}
        >
            {label}
        </button>
    );
};

// ✅ 중앙정렬
const th = {
    textAlign: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #ddd',
    background: '#f7f7f7',
    fontWeight: 700,
};

const td = {
    textAlign: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #eee',
};

export default Ranking;