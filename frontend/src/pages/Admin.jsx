import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPageNumberListApi } from '../apis/admin/adminApi.js';
import TreeMap from '../components/tree/TreeMap.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

const Admin = () => {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const pageParam = new URLSearchParams(search).get('page');
  const [currentPage, setCurrentPage] = useState(
    pageParam ? Number(pageParam) : 1,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['fetchPageNumberList'],
    queryFn: () => fetchPageNumberListApi(),
  });

  useEffect(() => {
    navigate({ pathname, search: `?page=${currentPage}` }, { replace: true });
  }, [currentPage, navigate, pathname]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          paddingLeft: '100px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginTop: '100px',
            marginBottom: '84px',
            display: 'flex',
            gap: '10px',
            paddingRight: '50px',
          }}
        >
          {data &&
            !isLoading &&
            !error &&
            data.map((page) => (
              <TableButton
                buttonText={page}
                active={currentPage === page}
                onClick={() => {
                  console.log(page);
                  setCurrentPage(page);
                }}
                key={page}
              />
            ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'start',
          paddingLeft: '100px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ backgroundColor: 'white' }}>
          <div style={{ padding: '0px 40px 50px 40px' }}>
            <TreeMap currentPage={currentPage} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TableButton = ({ buttonText, active, ...props }) => {
  return (
    <button
      style={{
        width: '100px',
        height: '36px',
        borderRadius: '5px',
        border: active ? '1px solid #2DB384' : '1px solid #000000',
        backgroundColor: active ? '#2DB384' : 'transparent',
        color: active ? 'white' : '#000000',
        fontSize: '20px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
      {...props}
    >
      {buttonText}
    </button>
  );
};

export default Admin;
