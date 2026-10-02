/**
 * Заглушка отправки форм для первого спринта:
 * отменяем перезагрузку страницы и выводим данные формы в консоль.
 */
export const handleForms = (): void => {
  document.addEventListener('submit', (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    console.log(`[form: ${form.name || 'unnamed'}]`, data);
  });
};
