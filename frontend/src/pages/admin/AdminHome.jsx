import {useQuery} from '@tanstack/react-query';
import {fetchTreeMapApi} from '../../apis/admin/adminApi.js';
import {useNavigate} from 'react-router-dom';
import Xarrow from 'react-xarrows';
import {useMemo} from "react";

const AdminHome = () => {
  const navigate = useNavigate();

  const {data, isLoading, error} = useQuery({
    queryKey: ['fetchTreeMap'],
    queryFn: () => fetchTreeMapApi({currentPage: 0}),
  });

  const rootNodes = data?.rootNodes ?? [];

  return (
      <div style={{marginLeft: '45px'}}>
        <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '35px',
            }}
        >
          <AdminPageTitle title={'관리자 페이지'}/>
          <button
              style={{padding: '1vw', marginLeft: '2vw', cursor: 'pointer'}}
              onClick={() => navigate('/admin/recommendMissing')}
          >
            미적용 데이터
          </button>
          <button
              style={{padding: '1vw', marginLeft: '2vw', cursor: 'pointer'}}
              onClick={() => navigate('/ranking')}
          >
            서포터즈 랭킹
          </button>
          <button
              style={{padding: '1vw', marginLeft: '2vw', cursor: 'pointer'}}
              onClick={() => navigate('/region')}
          >
            지역
          </button>
          <button
              style={{padding: '1vw', marginLeft: '2vw', cursor: 'pointer'}}
              onClick={() => navigate('/rightMember')}
          >
            당원
          </button>
          <div
              style={{
                marginLeft: '20px',
                padding: '8px 14px',
                borderRadius: '999px',       // pill 모양
                border: '1px solid #ddd',
                backgroundColor: '#f7f7f7',
                fontSize: '16px',
                fontWeight: 700,
                color: '#222',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
          >
            <span style={{opacity: 0.7, fontWeight: 600}}>전체</span>
            <span>{data?.totalSupportersNumber ?? 0}</span>
            <span style={{opacity: 0.7, fontWeight: 600}}>명</span>
          </div>
        </div>

        <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '30px',
              flexWrap: 'wrap',
            }}
        >
          {
            rootNodes.map((item) => <LeaderButton item={item}/>)}
        </div>
      </div>
  );
};

const LeaderButton = ({item}) => {
  const navigate = useNavigate();
  return (
      <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '169px',
            height: '70px',
            border: '1px solid #000',
            backgroundColor: 'transparent',
            borderRadius: '5px',
            fontSize: '20px',
            fontWeight: 'semibold',
            marginBottom: '15px',
            cursor: 'pointer',
          }}
          onClick={() => {
            navigate(`/admin/leader/${item.id}`);
          }}
      >
        {item.name}
      </div>
  );
};
const AdminPageTitle = ({title}) => {
  return (
      <>
        <div style={{fontSize: '35px', fontWeight: 800}}>{title}</div>
      </>
  );
};

export default AdminHome;
