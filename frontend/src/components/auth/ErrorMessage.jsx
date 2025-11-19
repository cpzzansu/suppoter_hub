const ErrorMessage = ({ errorMessage }) => {
  return (
    <div
      style={{
        marginTop: '5px',
        fontSize: '12px',
        color: '#FF3D71',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <img
        style={{ width: '24px' }}
        src='/assets/images/icon/error-icon.png'
        alt='에러아이콘'
      />
      {errorMessage}
    </div>
  );
};

export default ErrorMessage;
