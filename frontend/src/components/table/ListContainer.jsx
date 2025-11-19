import { useEffect, useRef, useState } from 'react';
import ListVIew from './ListVIew.jsx';
import Pagination from './Pagination.jsx';
import SearchBar from './SearchBar.jsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApplicantListApi } from '../../apis/auth/authApi.js';

const ListContainer = ({ columns, pageNumber }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchRef = useRef(null);

  const queryClient = useQueryClient();

  const handleSearchButtonClick = () => {
    setSearchTerm(searchRef.current.value);
  };

  useEffect(() => {
    setPageIndex(0);
  }, [pageNumber]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'fetchApplicantList',
      pageIndex,
      pageSize,
      searchTerm,
      pageNumber,
    ],
    queryFn: () =>
      fetchApplicantListApi({ pageIndex, pageSize, searchTerm, pageNumber }),
  });

  const pageCount = data && data.totalPages;

  return (
    <>
      <ListVIew
        data={data}
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageIndex={setPageIndex}
        setPageSize={setPageSize}
        setSearchTerm={setSearchTerm}
      />
      <Pagination
        setPageIndex={setPageIndex}
        pageCount={pageCount}
        pageIndex={pageIndex}
      />
      <SearchBar
        ref={searchRef}
        handleSearchButtonClick={handleSearchButtonClick}
      />
    </>
  );
};

export default ListContainer;
