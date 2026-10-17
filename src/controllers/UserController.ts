import { UserModel, type User } from '../models';
import type { FormValues } from '../utils/form';

const toStrings = (values: FormValues): Record<string, string> =>
  Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );

export const UserController = {
  getUser(): User {
    return UserModel.get();
  },

  updateProfile(values: FormValues): User {
    return UserModel.update(toStrings(values));
  },

  changePassword(values: FormValues): void {
    console.log('UserController.changePassword', values);
  },

  changeAvatar(values: FormValues): void {
    const { avatar } = values;

    if (avatar instanceof File && avatar.size > 0) {
      console.log('UserController.changeAvatar', avatar.name);
    }
  },
};
