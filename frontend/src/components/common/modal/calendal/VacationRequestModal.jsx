import Modal from '../Modal.jsx';
import PageTitle from '../../PageTitle.jsx';
import { forwardRef, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import '../../../calendar/CalendarCustomCss.css';
import OtherLeaveSelector from '../../../form/calendar/vacationRequestModal/OtherLeaveSelector.jsx';
import VacationRequestLeaveSelector from '../../../form/calendar/vacationRequestModal/VacationRequestLeaveSelector.jsx';
import SingleLeaveSelector from '../../../form/calendar/vacationRequestModal/SingleLeaveSelector.jsx';
import HalfDayLeaveSelector from '../../../form/calendar/vacationRequestModal/HalfDayLeaveSelector.jsx';
import MultiDayLeaveSelector from '../../../form/calendar/vacationRequestModal/MultiDayLeaveSelector.jsx';
import { useMutation } from '@tanstack/react-query';
import { createVacationRequestApi } from '../../../../apis/vacation/vacationApi.js';
const VacationRequestModal = ({ setModalOpen }) => {
  const [leaveDateTime, setLeaveDateTime] = useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: 0,
    endTime: 0,
    reason: '',
    leaveType: 'SingleDayLeave',
  });

  const createMutation = useMutation({
    mutationFn: createVacationRequestApi,
    onSuccess: () => {
      setModalOpen(false);
    },
    onError: () => {},
  });

  const renderLeaveSelector = () => {
    switch (leaveDateTime.leaveType) {
      case 'SingleDayLeave':
        return (
          <SingleLeaveSelector
            leaveDateTime={leaveDateTime}
            setLeaveDateTime={setLeaveDateTime}
          />
        );
      case 'HalfDayLeave':
        return (
          <HalfDayLeaveSelector
            leaveDateTime={leaveDateTime}
            setLeaveDateTime={setLeaveDateTime}
          />
        );
      case 'MultiDayLeave':
        return (
          <MultiDayLeaveSelector
            leaveDateTime={leaveDateTime}
            setLeaveDateTime={setLeaveDateTime}
          />
        );
      // case 'OtherLeave':
      //   return (
      //     <OtherLeaveSelector
      //       leaveDateTime={leaveDateTime}
      //       setLeaveDateTime={setLeaveDateTime}
      //     />
      //   );
      default:
        return null;
    }
  };

  const setLeaveType = (leaveType) => {
    setLeaveDateTime({
      ...leaveDateTime,
      leaveType,
    });
  };

  return (
    <Modal setModalOpen={setModalOpen}>
      <div
        style={{
          width: '860px',
          backgroundColor: 'white',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '50px',
          gap: '20px',
        }}
      >
        <PageTitle title={'휴가원 작성'} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginTop: '30px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <div
            style={{
              borderTop: '1px solid #EDF1F7',
            }}
          />
          <VacationRequestLeaveSelector
            leaveType={leaveDateTime.leaveType}
            setLeaveType={setLeaveType}
          />
          <LeaveSelectorContainer>
            {renderLeaveSelector()}
          </LeaveSelectorContainer>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <img
            style={{ width: '44px' }}
            src='/assets/images/icon/note-icon.png'
            alt='노트 아이콘'
          />
          <textarea
            className={'leave-reason-textarea'}
            style={{
              border: '1px solid #E2E3EC',
              borderRadius: '12px',
              color: '#192038',
              fontSize: '14px',
              padding: '12px 20px',
              width: '100%',
              height: '88px',
              boxSizing: 'border-box',
            }}
            placeholder={'휴가 사유를 작성해주세요.'}
            value={leaveDateTime.reason}
            onChange={(e) =>
              setLeaveDateTime({
                ...leaveDateTime,
                reason: e.target.value,
              })
            }
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'end', gap: '24px' }}>
          <button
            style={{
              width: '120px',
              height: '44px',
              backgroundColor: '#e15222',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (leaveDateTime.reason === '') {
                alert('휴가 사유를 작성해주세요.');
                return;
              }
              createMutation.mutate({ vacationRequest: leaveDateTime });
            }}
          >
            확인
          </button>
          <button
            style={{
              width: '120px',
              height: '44px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '12px',
              cursor: 'pointer',
              boxSizing: 'border-box',
              border: '1px solid #E4E9F2',
              backgroundColor: 'white',
            }}
            onClick={() => setModalOpen(false)}
          >
            취소
          </button>
        </div>
      </div>
    </Modal>
  );
};

const LeaveSelectorContainer = ({ children }) => {
  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ width: '44px' }}>
        <img src='/assets/images/icon/clock-icon.png' alt='시계모양 아이콘' />
      </div>
      <div
        style={{
          height: '44px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default VacationRequestModal;
