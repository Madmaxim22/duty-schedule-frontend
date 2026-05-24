import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { deleteAvatar, uploadAvatar } from '@/shared/api/client';
import type { UserRole } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import { ThemePicker } from '@/features/settings/ThemePicker';
import {
  applyTheme,
  loadTheme,
  saveTheme,
  type AppTheme,
} from '@/features/settings/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  onAvatarUpdated?: () => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
};

export function ProfileModal({ open, onClose, onAvatarUpdated }: Props) {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<AppTheme>(loadTheme);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    if (!open) return;
    setTheme(loadTheme());
    setAvatarError(null);
  }, [open]);

  const avatarUploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      setAvatarError(null);
      setAvatarVersion(Date.now());
      setUser(updatedUser);
      onAvatarUpdated?.();
    },
    onError: (err: Error) => setAvatarError(err.message),
  });

  const avatarDeleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (updatedUser) => {
      setAvatarError(null);
      setAvatarVersion(Date.now());
      setUser(updatedUser);
      onAvatarUpdated?.();
    },
    onError: (err: Error) => setAvatarError(err.message),
  });

  const isAvatarBusy = avatarUploadMutation.isPending || avatarDeleteMutation.isPending;

  function handleThemeChange(next: AppTheme) {
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  function openAvatarPicker() {
    if (isAvatarBusy) return;
    setAvatarError(null);
    fileInputRef.current?.click();
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    avatarUploadMutation.mutate(file);
  }

  const displayName = user?.fullName ?? '';
  const roleLabel = user ? ROLE_LABELS[user.role] : '';

  return (
    <Modal open={open} title="Профиль" onClose={onClose}>
      <div className="profile-modal">
        <section className="profile-modal__hero" aria-labelledby="profile-identity-heading">
          <div className="profile-modal__avatar-wrap">
            <Avatar
              fullName={displayName || '?'}
              avatarUrl={user?.avatarUrl}
              size="lg"
              cacheBust={avatarVersion || undefined}
            />
            {isAvatarBusy ? (
              <span className="profile-modal__avatar-overlay" aria-live="polite" aria-busy="true">
                <span className="profile-modal__spinner" aria-hidden />
                <span className="visually-hidden">Загрузка фото…</span>
              </span>
            ) : null}
          </div>

          <div className="profile-modal__identity">
            <h3 id="profile-identity-heading" className="profile-modal__name">
              {displayName || '—'}
            </h3>
            <p className="profile-modal__email">{user?.email}</p>
            {roleLabel ? (
              <span className="profile-modal__role">{roleLabel}</span>
            ) : null}
          </div>

          <div className="profile-modal__avatar-actions">
            <button
              type="button"
              className="profile-modal__action-btn"
              disabled={isAvatarBusy}
              onClick={openAvatarPicker}
            >
              {user?.avatarUrl ? 'Сменить фото' : 'Добавить фото'}
            </button>
            {user?.avatarUrl ? (
              <button
                type="button"
                className="profile-modal__action-btn profile-modal__action-btn--danger"
                disabled={isAvatarBusy}
                onClick={() => avatarDeleteMutation.mutate()}
              >
                Удалить фото
              </button>
            ) : null}
          </div>

          {avatarError ? (
            <p className="form-message form-message--error profile-modal__error" role="alert">
              {avatarError}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={handleAvatarFileChange}
          />
        </section>

        <section className="profile-modal__section" aria-labelledby="profile-theme-heading">
          <h3 id="profile-theme-heading" className="profile-modal__section-title">
            Тема оформления
          </h3>
          <p className="profile-modal__section-hint">
            Цветовая палитра интерфейса. Сохраняется на этом устройстве.
          </p>
          <ThemePicker theme={theme} onChange={handleThemeChange} />
        </section>
      </div>
    </Modal>
  );
}
