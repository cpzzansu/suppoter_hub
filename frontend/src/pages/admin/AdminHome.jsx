import { useQuery } from '@tanstack/react-query';
import { fetchTreeMapApi } from '../../apis/admin/adminApi.js';
import { useNavigate } from 'react-router-dom';
import Xarrow from 'react-xarrows';

const AdminHome = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fetchTreeMap'],
    queryFn: () => fetchTreeMapApi({ currentPage: 0 }),
  });

  return (
    <div style={{ marginLeft: '45px' }}>
      <AdminPageTitle title={'관리자 페이지'} />
      <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
        {data &&
          data.length > 0 &&
          data.map((item) => <LeaderButton item={item} />)}
      </div>
    </div>
  );
};

const LeaderButton = ({ item }) => {
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
const AdminPageTitle = ({ title }) => {
  return (
    <>
      <div style={{ fontSize: '35px', fontWeight: 800, marginTop: '35px' }}>
        {title}
      </div>
    </>
  );
};

export default AdminHome;
