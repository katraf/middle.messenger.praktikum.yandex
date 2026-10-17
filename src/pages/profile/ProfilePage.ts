import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import type { FieldProps } from '../../components';
import { UserController } from '../../controllers';
import type { User } from '../../models';
import { isValidatable, submitForm, type FormValues } from '../../utils/form';
import template from './profile.hbs?raw';
import './profile.pcss';

interface ProfilePageProps extends BlockOwnProps {
  user: User;
  profileFields: FieldProps[];
  passwordFields: FieldProps[];
}

const buildProfileFields = (user: User): FieldProps[] => [
  { label: 'Почта', name: 'email', type: 'email', value: user.email },
  { label: 'Логин', name: 'login', value: user.login },
  { label: 'Имя', name: 'first_name', value: user.first_name },
  { label: 'Фамилия', name: 'second_name', value: user.second_name },
  { label: 'Имя в чате', name: 'display_name', value: user.display_name },
  { label: 'Телефон', name: 'phone', type: 'tel', value: user.phone },
].map((field) => ({ ...field, variant: 'profile' as const }));

const passwordFields: FieldProps[] = [
  { label: 'Старый пароль', name: 'old_password', type: 'password', autocomplete: 'current-password' },
  { label: 'Новый пароль', name: 'new_password', type: 'password', autocomplete: 'new-password' },
].map((field) => ({ ...field, variant: 'profile' as const }));

export class ProfilePage extends Block<ProfilePageProps> {
  protected template = template;

  private formHandlers: Record<string, (values: FormValues) => void> = {
    avatar: (values) => UserController.changeAvatar(values),
    profile: (values) => this.saveProfile(values),
    password: (values) => UserController.changePassword(values),
  };

  protected events: EventListType = {
    submit: (event: Event) =>
      submitForm(event, this.children.filter(isValidatable), (values, form) =>
        this.formHandlers[form.name]?.(values),
      ),
  };

  constructor() {
    const user = UserController.getUser();
    super({ user, profileFields: buildProfileFields(user), passwordFields });
  }

  private saveProfile(values: FormValues): void {
    const user = UserController.updateProfile(values);
    // Новые props → заголовок с именем и поля перерисуются
    this.setProps({ user, profileFields: buildProfileFields(user) });
  }
}
