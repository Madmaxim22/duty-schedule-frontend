/** Совпадает с nginx `client_max_body_size` и MAX_CHAT_VIDEO_ATTACHMENT_SIZE на API. */
const UPLOAD_BODY_LIMIT_MB = 80;

export function resolveApiErrorMessage(
  status: number,
  payload?: Record<string, unknown>,
): string {
  const apiMessage = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (apiMessage) return apiMessage;

  switch (status) {
    case 0:
      return 'Нет подключения к сети';
    case 400:
      return 'Некорректный запрос';
    case 401:
      return 'Требуется авторизация';
    case 403:
      return 'Нет доступа';
    case 404:
      return 'Страница или ресурс не найдены';
    case 409:
      return 'Конфликт данных';
    case 413:
      return `Файл слишком большой (максимум ${UPLOAD_BODY_LIMIT_MB} МБ)`;
    case 429:
      return 'Слишком много запросов. Подождите немного';
    case 500:
      return 'Внутренняя ошибка сервера';
    case 502:
    case 503:
    case 504:
      return 'Сервер временно недоступен';
    default:
      if (status >= 500) return 'Ошибка сервера. Попробуйте позже';
      return 'Не удалось выполнить запрос. Попробуйте ещё раз';
  }
}

export function getUserFacingApiError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return 'Не удалось выполнить запрос. Попробуйте ещё раз';
}
