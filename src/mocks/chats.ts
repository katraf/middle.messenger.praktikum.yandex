export interface Chat {
  title: string;
  preview: string;
  time: string;
  unread?: number;
  isOwn?: boolean;
  isActive?: boolean;
}

export interface Message {
  text: string;
  time: string;
  isOwn?: boolean;
}

export const chats: Chat[] = [
  { title: 'Андрей', preview: 'Изображение', time: '10:49', unread: 2 },
  { title: 'Киноклуб', preview: 'стикер', time: '12:00', isOwn: true },
  { title: 'Илья', preview: 'Друзья, у меня для вас особенный выпуск новостей!', time: '15:12', unread: 4 },
  { title: 'Вадим', preview: 'Круто!', time: 'Пт', isOwn: true, isActive: true },
  { title: 'тет-а-теты', preview: 'И Human Interface Guidelines и Material Design рекомендуют…', time: 'Ср' },
  { title: '1, 2, 3', preview: 'Миллионы россиян ежедневно проводят десятки часов своего времени…', time: 'Пн' },
  { title: 'Design Destroyer', preview: 'В 2008 году художник Jon Rafman начал собирать…', time: 'Пн' },
  { title: 'Day.', preview: 'Так увлёкся работой по курсу, что совсем забыл его анонсировать', time: '1 мая 2020' },
];

export const messages: Message[] = [
  {
    text:
      'Привет! Смотри, тут всплыл интересный кусок лунной космической истории — НАСА в какой-то момент попросила Хассельблад адаптировать модель SWC для полетов на Луну.\n\n' +
      'Хассельблад в итоге адаптировал SWC для космоса, но что-то пошло не так, и на ракету они так никогда и не попали.',
    time: '11:56',
  },
  { text: 'Круто!', time: '12:00', isOwn: true },
];
