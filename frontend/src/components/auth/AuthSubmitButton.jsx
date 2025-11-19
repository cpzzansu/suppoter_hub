import styles from '../../pages/auth/Auth.module.css';

const AuthSubmitButton = ({ buttonText, ...props }) => {
  return (
    <button type='submit' className={styles.submitButton}>
      {buttonText}
    </button>
  );
};

export default AuthSubmitButton;
