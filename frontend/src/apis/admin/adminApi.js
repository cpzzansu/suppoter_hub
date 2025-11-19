import api from '../api.js';

export const fetchPageNumberListApi = async () => {
  const { data } = await api.get('/fetchPageNumberList');
  return data;
};

export const fetchTreeMapApi = async ({ currentPage }) => {
  const { data } = await api.get('/fetchTreeMap?currentPage=' + currentPage);
  return data;
};

export const fetchModifyInfoApi = async ({ id }) => {
  const { data } = await api.get('/fetchModifyInfo?id=' + id);
  return data;
};
