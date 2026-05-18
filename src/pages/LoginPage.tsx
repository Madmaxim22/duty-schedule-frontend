import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
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
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
    }
  });

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Вход</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />
        {error ? <p className="form-message form-message--error">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="auth-form__submit">
          {isSubmitting ? 'Вход…' : 'Войти'}
        </Button>
      </form>
      <p className="auth-page__link">
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
    </div>
  );
}
