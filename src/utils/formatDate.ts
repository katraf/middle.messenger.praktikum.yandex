const DAY = 24 * 60 * 60 * 1000;

/** Сегодня — «14:05», за последнюю неделю — «Пн», раньше — «01.05.2026» */
export const formatChatTime = (iso: string, now = new Date()): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  if (now.getTime() - date.getTime() < 7 * DAY) {
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  return date.toLocaleDateString('ru-RU');
};

/** Время сообщения: «14:05» */
export const formatMessageTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

/** Заголовок дня в ленте: «Сегодня», «Вчера», «18 ноября», «18 ноября 2025» */
export const formatMessageDay = (iso: string, now = new Date()): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }
  if (date.toDateString() === now.toDateString()) {
    return 'Сегодня';
  }
  if (date.toDateString() === new Date(now.getTime() - DAY).toDateString()) {
    return 'Вчера';
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
};
