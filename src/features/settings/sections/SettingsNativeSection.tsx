import { SettingsSection } from './SettingsSection';

export function SettingsNativeSection() {
  return (
    <SettingsSection
      titleId="settings-native-title"
      title="Приложение Android"
      className="settings-page__section--native"
    >
      <p className="settings-page__section-hint">
        Интерфейс и API обновляются с сайта автоматически. Новый APK нужен только при смене
        иконки launcher, разрешений или push-плагина.
      </p>
      <p className="settings-page__section-hint">
        Если push не приходят, проверьте системные настройки:{' '}
        <strong>Настройки → Приложения → «График дежурств» → Уведомления</strong>.
      </p>
    </SettingsSection>
  );
}
