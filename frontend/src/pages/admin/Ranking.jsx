import { useQuery } from '@tanstack/react-query';
import { fetchRanking } from '../../apis/admin/adminApi.js';

const Ranking = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ranking'], // ✅ 빈 배열 말고 의미 있는 key
    queryFn: fetchRanking, // ✅ () => fetchRanking() 도 OK
  });

  // ✅ fetchRanking() 응답이 배열이면 그대로, {data: [...] } 형태면 data.data로 맞춰주면 됨
  const rows = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}
    >
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

      <div style={{ padding: 16, width: '90%', maxWidth: 900 }}>
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
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={4}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.ranking ?? r.rank ?? idx}-${r.name ?? ''}`}>
                    <td style={td}>{r.ranking ?? r.rank ?? idx + 1}</td>
                    <td style={td}>{r.name}</td>
                    <td style={td}>{r.rootName}</td>
                    <td style={td}>{r.recommendedCount}</td>
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
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #ddd',
  background: '#f7f7f7',
  fontWeight: 700,
};

const td = {
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
};

export default Ranking;
