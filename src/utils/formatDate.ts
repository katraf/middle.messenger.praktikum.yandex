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
