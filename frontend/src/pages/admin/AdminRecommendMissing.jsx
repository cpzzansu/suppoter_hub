import { useQuery } from '@tanstack/react-query';
import { fetchRecommendMissingApi } from '../../apis/admin/adminApi.js';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const AdminRecommendMissing = () => {
  const navigate = useNavigate();

  const [dataFilter, setDataFilter] = useState('');

  const collator = new Intl.Collator('ko-KR', {
    sensitivity: 'base',
    numeric: true,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ['recommendMissing'],
    queryFn: fetchRecommendMissingApi,
  });

  const data = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const ax = (a.recommend ?? '').trim();
      const bx = (b.recommend ?? '').trim();

      // recommend가 빈 값(null/빈문자)은 맨 아래로
      if (!ax && !bx) return 0;
      if (!ax) return 1;
      if (!bx) return -1;

      const byRecommend = collator.compare(ax, bx);
      // recommend가 같으면 name으로 2차 정렬
      return byRecommend !== 0
        ? byRecommend
        : collator.compare(a.name ?? '', b.name ?? '');
    });

    if (!dataFilter) return sorted;

    return sorted.filter((row) => (row.address ?? '').includes(dataFilter));
  }, [rows, dataFilter, collator]);

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
        추천자 미적용 데이터
      </div>
      <div
        style={{
          paddingLeft: '3vw',
          paddingTop: '2vw',
          display: 'flex',
          gap: '0.5vw',
        }}
      >
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('전주')}
        >
          전주
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('군산')}
        >
          군산
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('익산')}
        >
          익산
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('완주')}
        >
          완주
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('김제')}
        >
          김제
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('남원')}
        >
          남원
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('정읍')}
        >
          정읍
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('고창')}
        >
          고창
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('무주')}
        >
          무주
        </button>

        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('진안')}
        >
          진안
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('임실')}
        >
          임실
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('부안')}
        >
          부안
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('장수')}
        >
          장수
        </button>
        <button
          style={{
            padding: '1vw',
            backgroundColor: '#00B887',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setDataFilter('순창')}
        >
          순창
        </button>
      </div>
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
        {data &&
          data.length > 0 &&
          data.map((missingData) => (
            <button
              style={{ padding: '1vw', margin: '0.5vw', cursor: 'pointer' }}
              onClick={() => {
                // setIsInfoModalOpen(true);
                // setSelectedNode(node);
                navigate(`/modifyInfo/${missingData.id}`);
              }}
            >
              <div>{missingData.name}</div>
              <div>추천자: {missingData.recommend}</div>
            </button>
          ))}
      </div>
    </div>
  );
};

export default AdminRecommendMissing;
