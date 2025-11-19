import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchModifyInfoApi } from '../../apis/admin/adminApi.js';
import { formatFourDigits, formatPhoneNumber } from '../../utils/commonUtil.js';
import { checkModifyValue, validateForm } from '../../utils/validate.js';
import { forwardRef, useRef } from 'react';
import { modifyForm } from '../../apis/form/formApi.js';
import styles from './Tree.module.css';

const ModifyInfo = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const formRefs = useRef({});

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
    <div className={styles.modal} onClick={() => navigate(-1)}>
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
          />
        </ModalValueContainer>
        <ModalValueContainer>
          <ModalLabel>추천인 코드</ModalLabel>
          <ModalInput
            defaultValue={data.recommendPhone}
            ref={(el) => {
              formRefs.current['recommendPhone'] = el;
            }}
            onInput={(e) => (e.target.value = formatFourDigits(e.target.value))}
          />
        </ModalValueContainer>
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
              const formData = {
                id: data.id,
                name: formRefs.current['name'].value,
                phone: formRefs.current['phone'].value,
                address: formRefs.current['address'].value,
                recommend: formRefs.current['recommend'].value,
                recommendPhone: formRefs.current['recommendPhone'].value,
              };

              const valueEqual = checkModifyValue({
                formData,
                selectedNode: data,
              });

              if (valueEqual) {
                alert('값이 변하지 않았습니다.');
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
