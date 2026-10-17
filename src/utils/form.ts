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

/**
 * Общий обработчик отправки любой формы:
 * отменяет перезагрузку, выводит данные в консоль,
 * проверяет все поля этой формы и при успехе вызывает onValid.
 */
export const submitForm = (
  event: Event,
  fields: Validatable[],
  onValid: (values: FormValues, form: HTMLFormElement) => void,
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
    onValid(values, form);
  }
};
