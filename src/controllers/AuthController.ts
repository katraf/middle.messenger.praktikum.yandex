import type { FormValues } from '../utils/form';

/** Пока без API: только принимает проверенные данные */
export const AuthController = {
  signIn(values: FormValues): void {
    console.log('AuthController.signIn', values);
  },

  signUp(values: FormValues): void {
    console.log('AuthController.signUp', values);
  },
};
