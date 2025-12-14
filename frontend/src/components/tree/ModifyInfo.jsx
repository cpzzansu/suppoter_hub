import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchModifyInfoApi,
  findRecommendApi,
} from '../../apis/admin/adminApi.js';
import { formatFourDigits, formatPhoneNumber } from '../../utils/commonUtil.js';
import { checkModifyValue, validateForm } from '../../utils/validate.js';
import { forwardRef, useCallback, useRef, useState } from 'react';
import { modifyForm } from '../../apis/form/formApi.js';
import styles from './Tree.module.css';

const ModifyInfo = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const formRefs = useRef({});

  const [recommendList, setRecommendList] = useState([]);
  const [selectedRecommend, setSelectedRecommend] = useState({});

  const backdropPointerDownOnSelf = useRef(false);

  const handleBackdropPointerDown = (e) => {
    // 백드롭 자체를 직접 누른 경우에만 true
    backdropPointerDownOnSelf.current = e.target === e.currentTarget;
  };

  const handleBackdropPointerUp = (e) => {
    // 다운과 업이 모두 백드롭에서 일어났을 때만 닫기
    if (backdropPointerDownOnSelf.current && e.target === e.currentTarget) {
      navigate(-1);
    }
    backdropPointerDownOnSelf.current = false;
  };

  const updateRecommendMutation = useMutation({
    mutationFn: findRecommendApi,
    onSuccess: (data) => {
      if (data.length === 0) {
        alert('추천인이 없습니다.');
        return;
      }

      if (data.length === 1) {
        setSelectedRecommend(data[0]);
      } else {
        setRecommendList(data);
      }
    },
    onError: (err, vars) => {
      console.error('추천인 찾기 실패', err);
      alert('추천인이 없습니다.');
    },
  });

  const handleRecommendBlur = useCallback(
    (e) => {
      const input = e.target;
      const next = (input.value ?? '').trim();
      const prev = (data.recommend ?? '').trim();

      if (next === prev) return;

      updateRecommendMutation.mutate({ recommend: next });
    },
    [updateRecommendMutation],
  );

  const modifyMutation = useMutation({
    mutationFn: modifyForm,
    onSuccess: (data) => {
      alert('수정되었습니다.');
      navigate(-1);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      console.error('등록중 에러가 발생했습니다.', err);
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fetchModifyInfo', id],
    queryFn: () => fetchModifyInfoApi({ id }),
    onError: (err) => {
      console.log(err);
      console.error('<UNK> <UNK> <UNK>.', err);
    },
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>오류가 발생했습니다.</div>;

  return (
    <div
      className={styles.modal}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <ModalValueContainer>
          <ModalLabel>이름</ModalLabel>
          <ModalInput
            defaultValue={data.name}
            ref={(el) => {
              formRefs.current['name'] = el;
            }}
          />
        </ModalValueContainer>
        <ModalValueContainer>
          <ModalLabel>폰번호</ModalLabel>
          <ModalInput
            defaultValue={data.phone}
            ref={(el) => {
              formRefs.current['phone'] = el;
            }}
            onInput={(e) =>
              (e.target.value = formatPhoneNumber(e.target.value))
            }
          />
        </ModalValueContainer>
        <ModalValueContainer>
          <ModalLabel>주소</ModalLabel>
          <ModalInput
            defaultValue={data.address}
            ref={(el) => {
              formRefs.current['address'] = el;
            }}
          />
        </ModalValueContainer>
        <ModalValueContainer>
          <ModalLabel>추천인 성명</ModalLabel>
          <ModalInput
            defaultValue={data.recommend}
            ref={(el) => {
              formRefs.current['recommend'] = el;
            }}
            onBlur={handleRecommendBlur}
            disabled={updateRecommendMutation.isPending}
          />
        </ModalValueContainer>
        {recommendList.length > 0 &&
          recommendList.map((recommend) => (
            <button
              style={{ padding: '1vw', margin: '0.5vw', cursor: 'pointer' }}
              onClick={() => setSelectedRecommend(recommend)}
            >
              {recommend.name + ' ' + recommend.phone}
            </button>
          ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              borderRadius: '5px',
              border: '1px solid black',
              fontSize: '18px',
              marginTop: '20px',
              cursor: 'pointer',
              color: 'black',
            }}
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              borderRadius: '5px',
              border: '1px solid black',
              fontSize: '18px',
              marginTop: '20px',
              cursor: 'pointer',
              color: 'black',
            }}
            onClick={() => {
              console.log(selectedRecommend.id);
              const formData = {
                id: data.id,
                name: formRefs.current['name'].value,
                phone: formRefs.current['phone'].value,
                address: formRefs.current['address'].value,
                recommend: formRefs.current['recommend'].value,
                selectedRecommendId: selectedRecommend.id,
              };

              const valueEqual = checkModifyValue({
                formData,
                selectedNode: data,
              });

              if (valueEqual) {
                alert('값이 변하지 않았습니다.');
                return;
              }

              if (!selectedRecommend) {
                alert('올바른 추천인을 선택해주세요.');
                return;
              }

              const isValid = validateForm(formData, true);
              if (!isValid) return;

              modifyMutation.mutate({ formData });
            }}
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalValueContainer = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    {children}
  </div>
);

const ModalLabel = ({ children }) => (
  <div style={{ width: '120px', fontSize: '20px', fontWeight: 600 }}>
    {children}
  </div>
);

const ModalInput = forwardRef(({ ...props }, ref) => {
  return <input {...props} ref={ref} />;
});

export default ModifyInfo;
