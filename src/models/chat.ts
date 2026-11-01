import type { User } from './user';

/** Чат в формате API (GET /chats) */
export interface Chat {
  id: number;
  title: string;
  avatar: string | null;
  unread_count: number;
  created_by: number;
  last_message: {
    user: Pick<User, 'first_name' | 'second_name' | 'avatar' | 'email' | 'login' | 'phone'>;
    time: string;
    content: string;
  } | null;
}

/** Участник чата (GET /chats/{id}/users) */
export interface ChatUser extends User {
  role: string;
}
