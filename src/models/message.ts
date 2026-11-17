/** Файл во вложении сообщения */
export interface MessageFile {
  id: number;
  user_id: number;
  path: string;
  filename: string;
  content_type: string;
  content_size: number;
  upload_date: string;
}

/** Сообщение чата в формате WebSocket API */
export interface ChatMessage {
  id: number;
  user_id: number;
  chat_id?: number;
  type: 'message' | 'file' | 'sticker';
  content: string;
  time: string;
  is_read?: boolean;
  file?: MessageFile | null;
}
