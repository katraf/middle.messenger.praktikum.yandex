interface Rule {
  pattern: RegExp;
  message: string;
}

/**
 * Правила валидации. Ключ — name поля (или явно переданное правило).
 * Описаны один раз и используются во всех формах.
 */
export const rules = {
  // Латиница или кириллица, первая буква заглавная, без пробелов и цифр, допустим дефис
  name: {
    pattern: /^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]*$/,
    message: 'С заглавной буквы, только буквы и дефис',
  },
  // 3–20 символов, латиница, цифры, дефис и подчёркивание, не только цифры
  login: {
    pattern: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]{3,20}$/,
    message: 'От 3 до 20 символов: латиница, цифры, - и _',
  },
  // Латиница, обязательна @ и точка после неё, перед точкой — буквы
  email: {
    pattern: /^[\w.-]+@(?:[a-zA-Z0-9-]*[a-zA-Z][a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/,
    message: 'Введите почту в формате name@example.com',
  },
  // 8–40 символов, хотя бы одна заглавная буква и цифра
  password: {
    pattern: /^(?=.*[A-ZА-ЯЁ])(?=.*\d).{8,40}$/,
    message: 'От 8 до 40 символов, заглавная буква и цифра',
  },
  // 10–15 цифр, может начинаться с плюса
  phone: {
    pattern: /^\+?\d{10,15}$/,
    message: 'От 10 до 15 цифр, можно начать с +',
  },
  // Не пустое и не только пробелы
  required: {
    pattern: /\S/,
    message: 'Заполните поле',
  },
} satisfies Record<string, Rule>;

export type RuleName = keyof typeof rules;

/** Какое правило применять к полю с данным name */
const ruleByField: Record<string, RuleName> = {
  first_name: 'name',
  second_name: 'name',
  login: 'login',
  email: 'email',
  password: 'password',
  new_password: 'password',
  phone: 'phone',
  display_name: 'required',
  old_password: 'required',
  message: 'required',
};

/** Возвращает текст ошибки или пустую строку, если значение корректно */
export const validate = (field: string, value: string): string => {
  const ruleName = field in rules ? (field as RuleName) : ruleByField[field];

  if (!ruleName) {
    return '';
  }

  const { pattern, message } = rules[ruleName];
  return pattern.test(value) ? '' : message;
};
