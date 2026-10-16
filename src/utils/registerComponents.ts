import { registerComponent } from '../core/registerComponent';
import { Avatar, Button, ChatItem, Field, Input, Message } from '../components';

export const registerComponents = (): void => {
  [Avatar, Button, ChatItem, Field, Input, Message].forEach(registerComponent);
};
