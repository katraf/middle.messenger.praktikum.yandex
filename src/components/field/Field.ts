import Block, { type BlockOwnProps } from '../../core/Block';
import { validate, type RuleName } from '../../utils/validation';
import type { Validatable } from '../../utils/form';
import template from './field.hbs?raw';
import './field.pcss';

export interface FieldProps extends BlockOwnProps {
  name: string;
  label: string;
  type?: string;
  value?: string;
  error?: string;
  autocomplete?: string;
  /** floating — подпись над полем (вход, регистрация), profile — строка настроек */
  variant?: 'floating' | 'profile';
  /** Явное правило валидации; по умолчанию берётся по name */
  rule?: RuleName;
  onBlur?: () => void;
}

export class Field extends Block<FieldProps> implements Validatable {
  static componentName = 'Field';

  protected template = template;

  constructor(props: FieldProps) {
    super(props);
    this.props.onBlur = () => this.validate();
  }

  /** Проверяет значение и показывает ошибку через setProps */
  public validate(): boolean {
    const input = this.refs.input;
    const value = input instanceof HTMLInputElement ? input.value : '';
    const error = validate(this.props.rule ?? this.props.name, value);

    this.setProps({ value, error });
    return !error;
  }

  /** Очищает значение и ошибку (form.reset() не подходит: value хранится в props) */
  public clear(): void {
    this.setProps({ value: '', error: '' });
  }
}
