import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import { router } from '../../router';
import template from './link.hbs?raw';

export interface LinkProps extends BlockOwnProps {
  href: string;
  text: string;
  variant?: 'muted' | 'danger';
  className?: string;
  label?: string;
  /** Стрелка «назад» вместо текста (с label для скринридеров) */
  icon?: 'back';
}

/** Ссылка с переходом через роутер, без перезагрузки страницы */
export class Link extends Block<LinkProps> {
  static componentName = 'Link';

  protected template = template;

  protected events: EventListType = {
    click: (event: Event) => {
      // Ctrl/Cmd+клик и средняя кнопка — открыть в новой вкладке, как обычная ссылка
      if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0)) {
        return;
      }

      event.preventDefault();
      router.go(this.props.href);
    },
  };
}
