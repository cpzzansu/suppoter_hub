import api from '../api.js';

export const fetchPageNumberListApi = async () => {
  const { data } = await api.get('/fetchPageNumberList');
  return data;
};

export const fetchLeaderNodeApi = async ({ leaderId }) => {
  const { data } = await api.get('/fetchLeaderNode?leaderId=' + leaderId);
  return data;
};

export const fetchTreeMapApi = async ({ currentPage }) => {
  const { data } = await api.get('/fetchTreeMap?currentPage=' + currentPage);
  return data;
};

export const fetchModifyInfoApi = async ({ id }) => {
  const { data } = await api.get('/supporterHome/fetchModifyInfo?id=' + id);
  return data;
};

export const findRecommendApi = async ({ recommend }) => {
  const { data } = await api.get(
    '/supporterHome/findRecommend?recommend=' + recommend,
  );
  return data;
};

export const fetchRecommendMissingApi = async () => {
  const { data } = await api.get('/supporterHome/fetchRecommendMissing');
  return data;
};

export const fetchRanking = async () => {
  const { data } = await api.get('/fetchRanking');
  return data;
};

export const fetchRegion = async ({region}) => {
  const { data } = await api.get('/fetchRegion?region=' + region);
  return data;
};

export const fetchRightMember = async () => {
  const { data } = await api.get('/fetchRightMember');
  return data;
};
