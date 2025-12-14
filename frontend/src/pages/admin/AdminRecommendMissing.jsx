import { useQuery } from '@tanstack/react-query';
import {
  fetchLeaderNodeApi,
  fetchRecommendMissingApi,
} from '../../apis/admin/adminApi.js';
import { useNavigate } from 'react-router-dom';

const AdminRecommendMissing = () => {
  const navigate = useNavigate();

  const collator = new Intl.Collator('ko-KR', {
    sensitivity: 'base',
    numeric: true,
  });

  const { data } = useQuery({
    queryKey: [],
    queryFn: () => fetchRecommendMissingApi(),
    select: (rows = []) =>
      rows.slice().sort((a, b) => {
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
      }),
  });

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
