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
          <div className={styles.loginTitle}>전주 완주 통합</div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthFormContainer;
