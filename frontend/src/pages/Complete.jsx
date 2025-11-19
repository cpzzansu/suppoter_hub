const Complete = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontFamily: 'PaperLogy',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '7.29vw',
          fontSize: '5.46vw',
          color: '#2DB384',
        }}
      >
        <div>전주 · 완주 통합되면</div>
        <div>이렇게 좋아집니다!</div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '5.21vw',
          marginBottom: '5.21vw',
        }}
      >
        <div
          style={{
            width: '78.12vw',
            height: '26.2vw',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '2.6vw',
          }}
        >
          <div
            style={{
              fontSize: '4.37vw',
              fontWeight: 600,
              marginBottom: '1.7vw',
            }}
          >
            제출이 완료되었습니다.
          </div>
          <div style={{ fontSize: '3.02vw', fontWeight: 600 }}>
            추후 기재해 주신 번호로 자료를 보내드립니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complete;
