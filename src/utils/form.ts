import type Block from '../core/Block';

export type FormValues = Record<string, FormDataEntryValue>;

/** Компонент, который умеет проверять сам себя (например, Field) */
export interface Validatable {
  validate(): boolean;
  element(): Element | null;
}

export const isValidatable = (block: Block<object>): block is Block<object> & Validatable =>
  typeof (block as Partial<Validatable>).validate === 'function';

export const getFormValues = (form: HTMLFormElement): FormValues =>
  Object.fromEntries(new FormData(form));

/** Строковые значения нужных полей формы: pickStrings(values, ['login', 'password']) */
export const pickStrings = <K extends string>(values: FormValues, keys: readonly K[]): Record<K, string> =>
  Object.fromEntries(
    keys.map((key) => {
      const value = values[key];
      return [key, typeof value === 'string' ? value : ''];
    }),
  ) as Record<K, string>;

/**
 * Общий обработчик отправки любой формы:
 * отменяет перезагрузку, выводит данные в консоль,
 * проверяет все поля этой формы и при успехе вызывает onValid.
 */
export const submitForm = (
  event: Event,
  fields: Validatable[],
  onValid: (values: FormValues, form: HTMLFormElement) => void | Promise<void>,
): void => {
  event.preventDefault();

  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const values = getFormValues(form);
  console.log(`[form: ${form.name}]`, values);

  const formFields = fields.filter((field) => form.contains(field.element()));
  // map, а не every: нужно показать ошибки во всех полях, а не только в первом
  const isValid = formFields.map((field) => field.validate()).every(Boolean);

  if (isValid) {
    void onValid(values, form);
  }
};

/** Текст под формой через textContent: ошибка сервера или подтверждение */
export const showStatus = (
  element: Element | undefined,
  text: string,
  kind: 'error' | 'success' = 'error',
): void => {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.classList.toggle('form-status--error', kind === 'error');
  element.classList.toggle('form-status--success', kind === 'success');
};

export const getErrorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
