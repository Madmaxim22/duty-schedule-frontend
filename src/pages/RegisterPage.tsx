import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/shared/ui/Input';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Button } from '@/shared/ui/Button';

const schema = z
  .object({
    lastName: z.string().min(1, 'Укажите фамилию'),
    firstName: z.string().min(1, 'Укажите имя'),
    patronymic: z.string().min(1, 'Укажите отчество'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль не менее 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
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
      const fullName = [data.lastName, data.firstName, data.patronymic]
        .map((part) => part.trim())
        .join(' ');
      const msg = await registerUser(data.email, data.password, fullName);
      setMessage(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации');
    }
  });

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">Регистрация</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <Input
          label="Фамилия"
          placeholder="Иванов"
          autoComplete="family-name"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
        <Input
          label="Имя"
          placeholder="Иван"
          autoComplete="given-name"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Отчество"
          placeholder="Иванович"
          autoComplete="additional-name"
          {...register('patronymic')}
          error={errors.patronymic?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="ivanov@example.com"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Не менее 6 символов"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />
        <PasswordInput
          label="Подтверждение пароля"
          placeholder="Повторите пароль"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
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
