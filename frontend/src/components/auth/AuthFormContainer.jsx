import styles from '../../pages/auth/Auth.module.css';

const AuthFormContainer = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.AuthFormContainer}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className={styles.loginTitle}>함께해요 관영 관리자</div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthFormContainer;
