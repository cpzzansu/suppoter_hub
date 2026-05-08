const Complete = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        containerType: 'inline-size',
      }}
    >
      <div
        style={{
          fontFamily: 'PaperLogy',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '7.29cqw',
          fontSize: '5.46cqw',
          color: '#2DB384',
        }}
      >
        <img
          style={{ width: '100%' }}
          src='/assets/images/complete_logo.jpg'
          alt='로고'
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '5.21cqw',
          marginBottom: '5.21cqw',
        }}
      >
        <div
          style={{
            width: '78.12cqw',
            height: '26.2cqw',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '2.6cqw',
          }}
        >
          <div
            style={{
              fontSize: '4.37cqw',
              fontWeight: 600,
              marginBottom: '1.7cqw',
            }}
          >
            제출이 완료되었습니다.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '10cqw',
        }}
      >
        <button
          style={{
            padding: '1.9cqw 10cqw',
            fontSize: '3.33cqw',
            fontWeight: 'bold',
            color: 'white',
            border: 'none',
            backgroundColor: '#0F418E',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onClick={() =>
            (window.location.href =
              'https://home.xn----qd6ew2cx70c6uae40epc.com')
          }
        >
          <div>
            <div>서포터즈 게시판</div>
            <div>바로가기</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Complete;
