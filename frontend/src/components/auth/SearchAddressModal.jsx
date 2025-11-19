import Modal from '../common/modal/Modal.jsx';
import { useEffect, useRef, useState } from 'react';

const SearchAddressModal = ({ setModalOpen, handleAddAddress }) => {
  const addressSearchRef = useRef(null);
  const [error, setError] = useState(null);
  const hasInitialized = useRef(false); // 초기화 여부를 추적하는 플래그

  useEffect(() => {
    if (hasInitialized.current) {
      return; // 이미 초기화된 경우 중단
    }

    // 다음(Postcode) API 스크립트가 이미 로드되었는지 확인
    if (window.daum && window.daum.Postcode) {
      initializePostcode();
      hasInitialized.current = true;
      return;
    }

    // 스크립트가 이미 로드되었는지 확인
    const existingScript = document.querySelector(
      'script[src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"]',
    );

    if (!existingScript) {
      // 스크립트 로드
      const script = document.createElement('script');
      script.src =
        '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        initializePostcode();
        hasInitialized.current = true;
      };
      script.onerror = () => {
        setError('주소 검색 스크립트 로드에 실패했습니다.');
      };
      document.body.appendChild(script);
    } else {
      // 이미 스크립트가 로드된 경우 초기화
      initializePostcode();
      hasInitialized.current = true;
    }

    // Cleanup: 컴포넌트 언마운트 시 주소 검색 창 제거
    return () => {
      if (addressSearchRef.current) {
        addressSearchRef.current.innerHTML = '';
        hasInitialized.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePostcode = () => {
    if (!window.daum || !window.daum.Postcode || !addressSearchRef.current) {
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.buildingName !== '') {
            extraAddress +=
              extraAddress !== ''
                ? `, ${data.buildingName}`
                : data.buildingName;
          }
          fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
        }

        handleAddAddress(data.zonecode, fullAddress);

        setModalOpen(false);
      },
      // 주소 검색 창을 임베드할 컨테이너 지정
      container: addressSearchRef.current,
    }).embed(addressSearchRef.current);

    // 임베드된 주소 검색 창의 레이어 스타일 조정
    setTimeout(() => {
      const layers = addressSearchRef.current.querySelectorAll(
        'div[id^="__daum__layer_"]',
      );
      layers.forEach((layer) => {
        layer.style.width = '100%';
        layer.style.height = '500px';
        layer.style.backgroundColor = '#f0f0f0'; // 원하는 배경색으로 변경
        // 추가적인 스타일 조정
      });
    }, 100); // 임베드 후 약간의 딜레이를 줘서 DOM 요소가 생성되도록 함
  };

  return (
    <Modal style={{ width: '1000px' }} setModalOpen={setModalOpen}>
      <div
        style={{
          width: '100%',
          borderTop: '1px solid #999999',
          borderBottom: '1px solid #999999',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div
          ref={addressSearchRef}
          style={{ width: '100%', height: '500px' }}
        ></div>
      </div>
    </Modal>
  );
};

export default SearchAddressModal;
