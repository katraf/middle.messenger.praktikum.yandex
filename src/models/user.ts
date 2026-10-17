export interface User {
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  avatar?: string;
}

// Моковые данные до подключения API
let currentUser: User = {
  first_name: 'Иван',
  second_name: 'Иванов',
  display_name: 'Иван',
  login: 'ivanivanov',
  email: 'pochta@yandex.ru',
  phone: '+79099673030',
};

export const UserModel = {
  get(): User {
    return currentUser;
  },

  update(data: Partial<User>): User {
    currentUser = { ...currentUser, ...data };
    return currentUser;
  },
};
