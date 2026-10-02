# Мессенджер

Учебный проект мессенджера: TypeScript + Vite + Handlebars + PostCSS.
Спринт 1.

## Команды

- `npm install` — установка зависимостей
- `npm run dev` — dev-сервер на http://localhost:3000
- `npm run build` — проверка типов и сборка в `dist`
- `npm run start` — сборка и запуск статического сервера на 3000 порту

## Страницы

| Путь | Страница |
|------|----------|
| `/` | Навигация по всем страницам |
| `/login` | Авторизация |
| `/sign-up` | Регистрация |
| `/messenger` | Список чатов и переписка |
| `/settings` | Настройки профиля |
| `/404` | Не найдено |
| `/500` | Ошибка сервера |

## Прототипы

Прототипы экранов лежат в папке [`ui`](./ui).

## Деплой

Netlify: https://katrafmessenger.netlify.app/sign-up

## Структура

```
src/
  components/   переиспользуемые partials (Button, Field, Avatar, ChatItem…) со своими стилями
  pages/        страницы: шаблон .hbs + стили .pcss + index.ts с контекстом
  mocks/        моковые данные для заглушек
  styles/       переменные и базовые стили
  utils/        render, регистрация partials, создание страниц, обработка форм
  router.ts     сопоставление pathname → страница
  main.ts       точка входа
```
