import { useState } from 'react';
import { href, useNavigate, useParams } from 'react-router-dom';
import { submitForm } from '../apis/form/formApi.js';
import { formatFourDigits, formatPhoneNumber } from '../utils/commonUtil.js';
import { validateForm } from '../utils/validate.js';

const MainForm = () => {
  // const { pageNumber } = useParams();

  const navigate = useNavigate();

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPrivacyAgree, setIsPrivacyAgree] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    recommend: '',
    recommendPhone: '',
    isRightsMember: false,
  });

  const handleSubmit = async () => {
    const isValid = validateForm(formData, isPrivacyAgree);
    if (!isValid) return;

    // await fetch('https://wanjeon.co.kr/api/form?pageNumber=' + pageNumber, {
    //   // await fetch('http://localhost:8080/api/form?pageNumber=' + pageNumber, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json', // JSON 형식임을 명시
    //   },
    //   body: JSON.stringify(formData),
    // });

    await submitForm({ formData })
      .then(() => {
        navigate('/complete');
      })
      .catch((error) => {
        if (error.status === 409) {
          alert('이미 가입된 전화번호입니다.');
        } else {
          alert('제출에 실패했습니다.');
        }
      });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div>
        <img
          style={{ width: '100%' }}
          src='/assets/images/form_logo.png'
          alt='로고'
        />
        {/*<img style={{width: '100%'}} src="/assets/images/Logo2.png" alt="로고"/>*/}
      </div>
      <div style={{ display: 'flex', justifyContent: 'end', marginTop: '4vw' }}>
        <button
          style={{
            padding: '1.9vw 10vw',
            fontSize: '3.33vw',
            fontWeight: 'bold',
            color: 'white',
            border: 'none',
            backgroundColor: '#0F418E',
            borderRadius: '5px',
            marginRight: '6vw',
            cursor: 'pointer',
          }}
          onClick={() =>
            (window.location.href =
              'https://home.xn----qd6ew2cx70c6uae40epc.com/login/')
          }
        >
          <div>
            <div>기존회원</div>
            <div>로그인하기</div>
          </div>
        </button>
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            marginTop: '10vw',
            paddingLeft: '3.22vw',
            paddingRight: '3.22vw',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div>
            <FormLabel labelName={'이름'} />
            <FormInput
              type={'text'}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <FormLabel labelName={'연락처'} />
            <FormInput
              type={'text'}
              value={formData.phone}
              onChange={(e) => {
                const raw = e.target.value;
                const formatted = formatPhoneNumber(raw);
                setFormData({ ...formData, phone: formatted });
              }}
            />
            <FormLabel
              labelName={'지역 '}
              strongLabel={'(시 · 군 · 읍 · 면 · 동 표기)'}
            />
            <FormInput
              type={'text'}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
            <FormLabel labelName={'권리당원 유무'} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '5vw',
                fontSize: '4vw',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setFormData({ ...formData, isRightsMember: true })
                }
              >
                <img
                  style={{
                    width: '7vw',
                    marginRight: '3vw',
                  }}
                  src={
                    formData.isRightsMember
                      ? '/assets/images/checkedbox.png'
                      : '/assets/images/checkbox.png'
                  }
                  alt='체크박스'
                />
                예
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setFormData({ ...formData, isRightsMember: false })
                }
              >
                <img
                  style={{
                    width: '7vw',
                    marginRight: '3vw',
                    marginLeft: '5vw',
                  }}
                  src={
                    !formData.isRightsMember
                      ? '/assets/images/checkedbox.png'
                      : '/assets/images/checkbox.png'
                  }
                  alt='체크박스'
                />
                아니오
              </div>
            </div>
            <div
              style={{
                borderTop: '1px solid #000000',
                paddingBottom: '5.14vw',
                marginTop: '1.2vw',
              }}
            />
            <FormLabel labelName={'추천인 성함을 입력해 주세요.'} />
            <FormInput
              type={'text'}
              value={formData.recommend}
              onChange={(e) =>
                setFormData({ ...formData, recommend: e.target.value })
              }
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '3.38vw',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsPrivacyAgree(!isPrivacyAgree);
              }}
            >
              <img
                style={{
                  width: '7vw',
                  marginRight: '1.56vw',
                }}
                src={
                  isPrivacyAgree
                    ? '/assets/images/checkedbox.png'
                    : '/assets/images/checkbox.png'
                }
                alt='체크박스'
              />
              아래에 고지된 개인정보활용에 동의합니다.
            </div>
          </div>
        </div>
        <div
          style={{
            width: '100vw',
            height: '6.25vw',
            backgroundColor: '#F3F3F3',
            display: 'flex',
            alignItems: 'center',
            fontSize: '2.6vw',
            fontWeight: 600,
            cursor: 'pointer',
            paddingLeft: '10.94vw',
            paddingRight: '10.94vw',
            marginTop: '5.2vw',
            border: '0.15vw solid #EFEFEF',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
        >
          개인정보활용동의서{' '}
          <img
            src={
              isPrivacyOpen
                ? '/assets/images/arrow-up.png'
                : '/assets/images/arrow-down.png'
            }
            alt='화살표'
            style={{ marginLeft: '1.2vw', width: '1.61vw' }}
          />
        </div>
        <img
          style={{
            width: '100vw',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: -1,
          }}
          src='/assets/images/form-background.png'
          alt='배경화면'
        />
      </div>
      {isPrivacyOpen && (
        <div
          style={{
            padding: '3.9vw 10.94vw',
            height: '100%',
            backgroundColor: 'white',
            borderBottom: '0.15vw solid #EFEFEF',
          }}
        >
          <div
            style={{
              whiteSpace: 'pre-line',
              fontFamily: 'Noto music',
              height: '100%',
              fontSize: '1.2vw',
            }}
          >
            {'개인정보 수집·이용 동의서\n' +
              '\n' +
              '함께해요-관영.com(이하 “회사”)는 개인정보보호법 등 관계 법령에 따라 이용자의 개인정보를 안전하게 처리하기 위해 아래와 같이 개인정보 수집·이용 동의를 받고자 합니다.\n' +
              '\t\n' +
              '1.\t수집하는 개인정보 항목\n' +
              '\t•\t성명\n' +
              '\t•\t주소\n' +
              '\t•\t연락처\n' +
              '\t•\t추천인 성명\n' +
              '\n' +
              '\t2.\t개인정보 수집·이용 목적\n' +
              '  \t1.\t본인 식별\n' +
              '\t　2.\t서비스 이용에 따른 고지사항 전달\n' +
              '\t　3.\t이벤트 · 프로모션 등 마케팅 및 광고에 활용\n' +
              '\n' +
              '\t3.\t개인정보 보유·이용 기간\n' +
              '\t•\t동의일로부터 서비스 종료 시까지\n' +
              '\t•\t단, 관련 법령에 따라 보존이 필요한 경우에는 해당 기간 동안 보관\n' +
              '\n' +
              '\t4.\t개인정보 파기 절차 및 방법\n' +
              '\t•\t파기절차 : 수집 목적 달성 후 내부 방침 및 기타 관련 법령에 따른 개인정보 보관 기간이 경과된 경우 별도 일정에 따라 파기\n' +
              '\t•\t파기방법 :\n' +
              '\t　•\t전자적 파일 형태 : 기록을 재생할 수 없는 기술적 방법으로 영구 삭제\n' +
              '\t　•\t종이문서 : 분쇄기로 분쇄하거나 소각 \n' +
              '\n' +
              '\t5.\t동의를 거부할 권리 및 불이익 안내\n' +
              '\t•\t귀하는 개인정보 수집·이용 동의를 거부할 권리가 있습니다.\n' +
              '\t•\t다만, 필수항목에 대한 동의를 거부하실 경우 서비스 이용이 제한될 수 있습니다.\n' +
              '\n' +
              '\t 6.\t개인정보 보호책임자\n' +
              '\t•\t성명 : 홍민희\n' +
              '\t•\t직위 : 팀장\n' +
              '\t•\t연락처: 010-6689-2503'}
          </div>
        </div>
      )}
      <div
        style={{
          backgroundColor: 'white',
          padding: '5.2vw 0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          style={{
            width: '30vw',
            height: '12vw',
            border: '0.11vw solid #000000',
            borderRadius: '1.04vw',
            backgroundColor: '#ffffff',
            fontSize: '5vw',
            fontWeight: 600,
            cursor: 'pointer',
            boxSizing: 'border-box',
            color: '#000000',
          }}
          onClick={handleSubmit}
        >
          제출하기
        </button>
      </div>
    </div>
  );
};

const FormLabel = ({ labelName, subLabel, strongLabel }) => {
  return (
    <div
      style={{ fontSize: '4.16vw', fontWeight: 600, marginBottom: '2.08vw' }}
    >
      {labelName}
      {subLabel && (
        <span style={{ color: '#939393', fontSize: '2.6vw' }}> {subLabel}</span>
      )}
      {strongLabel && <span style={{ fontWeight: 900 }}> {strongLabel}</span>}
    </div>
  );
};

const FormInput = ({ ...props }) => {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        height: '9.37vw',
        border: 'none',
        borderRadius: '0.78vw',
        backgroundColor: '#EFEFEF',
        marginBottom: '5.2vw',
        fontSize: '4.12vw',
        paddingLeft: '2.04vw',
        paddingRight: '2.04vw',
        boxSizing: 'border-box',
      }}
    />
  );
};

export default MainForm;
