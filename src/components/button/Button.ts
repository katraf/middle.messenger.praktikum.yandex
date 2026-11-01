import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import template from './button.hbs?raw';
import './button.pcss';

export interface ButtonProps extends BlockOwnProps {
  text: string;
  type?: 'button' | 'submit';
  variant?: 'small' | 'text' | 'danger';
  onClick?: (event: Event) => void;
}

export class Button extends Block<ButtonProps> {
  static componentName = 'Button';

  protected template = template;

  protected events: EventListType = {
    click: (event: Event) => this.props.onClick?.(event),
  };
}
