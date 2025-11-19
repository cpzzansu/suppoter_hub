import api from '../api.js';

export const submitForm = async ({ pageNumber, formData }) => {
  const { data } = await api.post('/form?pageNumber=' + pageNumber, formData);
  return data;
};

export const modifyForm = async ({ formData }) => {
  const { data } = await api.put('/modifyForm', formData);
  return data;
};
