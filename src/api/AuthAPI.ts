import type { SignInData, SignUpData, User } from '../models';
import { createTransport } from './base';

const http = createTransport('/auth');

export const AuthAPI = {
  signUp: (data: SignUpData) => http.post<{ id: number }>('/signup', { data }),

  signIn: (data: SignInData) => http.post('/signin', { data }),

  getUser: () => http.get<User>('/user'),

  logout: () => http.post('/logout'),
};
