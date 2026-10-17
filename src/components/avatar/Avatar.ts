import Block, { type BlockOwnProps } from '../../core/Block';
import template from './avatar.hbs?raw';
import './avatar.pcss';

export interface AvatarProps extends BlockOwnProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'large';
}

export class Avatar extends Block<AvatarProps> {
  static componentName = 'Avatar';

  protected template = template;
}
