import { registerComponent } from '../core/registerComponent';
import { Avatar, Button, ChatItem, Field, Input, Link, Message } from '../components';

export const registerComponents = (): void => {
  [Avatar, Button, ChatItem, Field, Input, Link, Message].forEach(registerComponent);
};
