import styles from '../../pages/auth/Auth.module.css';
import ErrorMessage from './ErrorMessage.jsx';

const AuthInput = ({ labelText, errorMessage, ...props }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div className={styles.label}>{labelText}</div>
      <input
        {...props}
        className={errorMessage ? styles.errorLoginInput : styles.loginInput}
      />
      {errorMessage && <ErrorMessage errorMessage={errorMessage} />}
    </div>
  );
};

export default AuthInput;
