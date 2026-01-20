import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRightMember } from '../../apis/admin/adminApi.js';

const RightMember = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['rightMember'],
    queryFn: fetchRightMember,
  });

  const rows = useMemo(() => {
    const arr = Array.isArray(data) ? data : data?.data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  return (
      <div>
        <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '3vw',
              paddingRight: '3vw',
              paddingTop: '2vw',
            }}
        >
          <div style={{ fontSize: '4vw', fontWeight: 800 }}>
            권리당원 데이터
          </div>

          <div
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid #ddd',
                backgroundColor: '#f7f7f7',
                fontSize: '16px',
                fontWeight: 800,
                color: '#222',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
          >
            <span style={{ opacity: 0.7, fontWeight: 600 }}>전체</span>
            <span>{rows.length}</span>
            <span style={{ opacity: 0.7, fontWeight: 600 }}>명</span>
          </div>
        </div>
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

export default RightMember;