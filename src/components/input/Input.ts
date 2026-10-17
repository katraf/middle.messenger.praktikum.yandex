import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import template from './input.hbs?raw';

export interface InputProps extends BlockOwnProps {
  name: string;
  type?: string;
  value?: string;
  className?: string;
  placeholder?: string;
  autocomplete?: string;
  label?: string;
  onBlur?: () => void;
}

export class Input extends Block<InputProps> {
  static componentName = 'Input';

  protected template = template;

  protected events: EventListType = {
    blur: () => this.props.onBlur?.(),
  };
}
