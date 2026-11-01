import type { PasswordData, ProfileData, User } from '../models';
import { createTransport } from './base';

const http = createTransport('/user');

export const UserAPI = {
  updateProfile: (data: ProfileData) => http.put<User>('/profile', { data }),

  /** FormData с полем avatar */
  updateAvatar: (data: FormData) => http.put<User>('/profile/avatar', { data }),

  updatePassword: (data: PasswordData) => http.put('/password', { data }),

  search: (login: string) => http.post<User[]>('/search', { data: { login } }),
};
