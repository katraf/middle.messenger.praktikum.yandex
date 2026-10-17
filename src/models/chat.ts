export interface Chat {
  id: number;
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

const chats: Chat[] = [
  { id: 1, title: 'Андрей', preview: 'Изображение', time: '10:49', unread: 2 },
  { id: 2, title: 'Киноклуб', preview: 'стикер', time: '12:00', isOwn: true },
  { id: 3, title: 'Илья', preview: 'Друзья, у меня для вас особенный выпуск новостей!', time: '15:12', unread: 4 },
  { id: 4, title: 'Вадим', preview: 'Круто!', time: 'Пт', isOwn: true },
  { id: 5, title: 'тет-а-теты', preview: 'И Human Interface Guidelines и Material Design рекомендуют…', time: 'Ср' },
  { id: 6, title: '1, 2, 3', preview: 'Миллионы россиян ежедневно проводят десятки часов своего времени…', time: 'Пн' },
  { id: 7, title: 'Design Destroyer', preview: 'В 2008 году художник Jon Rafman начал собирать…', time: 'Пн' },
  { id: 8, title: 'Day.', preview: 'Так увлёкся работой по курсу, что совсем забыл его анонсировать', time: '1 мая 2020' },
];

let messages: Message[] = [
  {
    text:
      'Привет! Смотри, тут всплыл интересный кусок лунной космической истории — НАСА в какой-то момент попросила Хассельблад адаптировать модель SWC для полетов на Луну.\n\n' +
      'Хассельблад в итоге адаптировал SWC для космоса, но что-то пошло не так, и на ракету они так никогда и не попали.',
    time: '11:56',
  },
  { text: 'Круто!', time: '12:00', isOwn: true },
];

export const ChatModel = {
  activeChatId: 4,

  getChats(): Chat[] {
    return chats.map((chat) => ({ ...chat, isActive: chat.id === this.activeChatId }));
  },

  getActiveChat(): Chat | undefined {
    return chats.find((chat) => chat.id === this.activeChatId);
  },

  getMessages(): Message[] {
    return messages;
  },

  addMessage(message: Message): Message[] {
    // Новый массив, чтобы Block увидел изменение props
    messages = [...messages, message];
    return messages;
  },
};
