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
        <img
          style={{ width: '100%' }}
          src='/assets/images/complete_logo.png'
          alt='로고'
        />
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
        </div>
      </div>
    </div>
  );
};

export default Complete;
