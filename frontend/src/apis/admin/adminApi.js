import api from '../api.js';

export const fetchPageNumberListApi = async () => {
  const { data } = await api.get('/fetchPageNumberList');
  return data;
};

export const fetchLeaderNodeApi = async ({ leaderId }) => {
  const { data } = await api.get('/fetchLeaderNode?leaderId=' + leaderId);
  return data;
};

/** 대표트리 시트용 (숫자 leaderId 직접 호출: 이제 인증 필요) */
export const fetchSheetForLeaderApi = async ({ leaderId }) => {
  const { data } = await api.get('/fetchSheetForLeader?leaderId=' + leaderId);
  return data;
};

/** 전체 supporter 트리 조회 (전화번호 매칭 등에 사용) */
export const fetchSheetSupporterApi = async () => {
  const { data } = await api.get('/fetchSheetSupporter', {
    timeout: 60000,
  });
  return data;
};

/** 연락처 전화번호 목록을 서버로 보내 매칭된 Supporter만 반환 (경량 API) */
export const matchSupporterByPhonesApi = async (phoneNumbers) => {
  const { data } = await api.post('/matchSupporterByPhones', {
    phoneNumbers: phoneNumbers ?? [],
  });
  return Array.isArray(data) ? data : [];
};

/** 대표트리 공유 링크 토큰 발급 (관리자 화면에서 사용) */
export const createSheetLinkTokenApi = async ({ leaderId }) => {
  const { data } = await api.get('/sheetLinkToken?leaderId=' + leaderId, {
    timeout: 30000,
  });
  return data; // token string
};

/** 대표트리 공유 링크 조회 (공개 URL에서 사용, 인증 없이 호출 가능) */
export const fetchSheetForLeaderByTokenApi = async ({ token }) => {
  const { data } = await api.get('/fetchSheetForLeaderByToken', {
    params: { t: token },
    timeout: 30000,
  });
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

export const fetchRanking = async ({ includePath = false } = {}) => {
  const { data } = await api.get('/fetchRanking', {
    params: includePath ? { includePath: true } : undefined,
    timeout: 30000,
  });
  return data;
};

/** 직계자손(직접 추천한 사람 수) 랭킹. 10명 이상만. */
export const fetchDirectChildrenRanking = async ({
  includePath = false,
} = {}) => {
  const { data } = await api.get('/fetchDirectChildrenRanking', {
    params: includePath ? { includePath: true } : undefined,
    timeout: 30000,
  });
  return data;
};

export const fetchRegion = async ({ region, keyword, page, size, unapplied = false }) => {
  const { data } = await api.get('/fetchRegion', {
    params: { region, keyword, page, size, unapplied },
  });
  return data;
};

export const fetchRightMember = async () => {
  const { data } = await api.get('/fetchRightMember');
  return data;
};

export const fetchRegionExcel = async ({ region, keyword, unapplied = false }) => {
  return await api.get('/fetchRegionExcel', { params: { region, keyword, unapplied } });
};

export const fetchDeletionLog = async () => {
  const { data } = await api.get('/admin/suppoter/deletion-log');
  return data;
};

/** Minjoo 등록: 4개 입력 + 연락처 배열 */
export const minjooRegisterApi = async (payload) => {
  const { data } = await api.post('/minjoo/register', payload, {
    timeout: 120000,
  });
  return data;
};
