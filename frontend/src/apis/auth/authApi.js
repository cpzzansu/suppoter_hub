import api from '../api.js';

export const loginApi = async ({ member }) => {
  const { data } = await api.post('/login', member);
  return data;
};

export const fetchApplicantListApi = async ({
  pageIndex,
  pageSize,
  searchTerm,
  pageNumber,
}) => {
  const { data } = await api.get(
    '/fetchApplicantList?pageIndex=' +
      pageIndex +
      '&pageSize=' +
      pageSize +
      '&searchTerm=' +
      searchTerm +
      '&pageNumber=' +
      pageNumber,
  );
  return data;
};
