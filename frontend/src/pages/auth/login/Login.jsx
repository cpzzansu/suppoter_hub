import styles from '../Auth.module.css';
import { useNavigate } from 'react-router-dom';
import AuthFormContainer from '../../../components/auth/AuthFormContainer.jsx';
import AuthInput from '../../../components/auth/AuthInput.jsx';
import AuthSubmitButton from '../../../components/auth/AuthSubmitButton.jsx';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../../../apis/auth/authApi.js';

const schema = yup.object({
  memberId: yup.string().required('아이디를 입력해주세요.'),
  password: yup.string().required('비밀번호를 입력해주세요.'),
});

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setValue,
  } = useForm({
    mode: 'onBlur',
    resolver: yupResolver(schema),
    defaultValues: {
      memberId: '',
      password: '',
    },
  });

  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('memberId', data.memberId);
      navigate('/admin');
    },
    onError: (error) => {
      alert('아이디 또는 비밀번호가 잘못 되었습니다. ');
    },
  });

  const onSignUpClick = (e) => {
    e.preventDefault();
    navigate('/signUp');
  };

  const onSubmit = (data) => {
    loginMutation.mutate({ member: data });
  };

  return (
    <AuthFormContainer>
      <form
        style={{ display: 'flex', flexDirection: 'column' }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <AuthInput
          labelText={'아이디'}
          type={'text'}
          {...register('memberId')}
          placeholder={'아이디를 입력하세요.'}
          errorMessage={errors.memberId?.message}
        />
        <AuthInput
          labelText={'비밀번호'}
          type={'password'}
          {...register('password')}
          placeholder={'비밀번호를 입력하세요.'}
          errorMessage={errors.password?.message}
        />
        <AuthSubmitButton buttonText={'로그인'} />
      </form>
    </AuthFormContainer>
  );
};

export default Login;
