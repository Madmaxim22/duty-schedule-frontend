import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

const schema = z.object({
  fullName: z.string().min(2, 'Укажите ФИО'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль не менее 6 символов'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (data) => {
    setError('');
    setMessage('');
    try {
      const msg = await registerUser(data.email, data.password, data.fullName);
      setMessage(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации');
    }
  });

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Регистрация</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <Input label="ФИО" {...register('fullName')} error={errors.fullName?.message} />
        <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />
        {error ? <p className="form-message form-message--error">{error}</p> : null}
        {message ? <p className="form-message form-message--success">{message}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="auth-form__submit">
          {isSubmitting ? 'Отправка…' : 'Зарегистрироваться'}
        </Button>
      </form>
      <p className="auth-page__link">
        Уже есть аккаунт? <Link to="/login">Вход</Link>
      </p>
    </div>
  );
}
