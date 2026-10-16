import { ChatModel, type Chat, type Message } from '../models';

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const ChatController = {
  getChats(): Chat[] {
    return ChatModel.getChats();
  },

  getActiveChat(): Chat | undefined {
    return ChatModel.getActiveChat();
  },

  getMessages(): Message[] {
    return ChatModel.getMessages();
  },

  sendMessage(text: string): Message[] {
    return ChatModel.addMessage({ text: text.trim(), time: formatTime(new Date()), isOwn: true });
  },
};
