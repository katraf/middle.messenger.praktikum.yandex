import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import { getResourceUrl } from '../../api';
import { Field, type FieldProps } from '../../components';
import { AuthController, UserController } from '../../controllers';
import { store, type User } from '../../models';
import { Routes } from '../../router';
import {
  getErrorText,
  isValidatable,
  pickStrings,
  showStatus,
  submitForm,
  type FormValues,
} from '../../utils/form';
import template from './profile.hbs?raw';
import './profile.pcss';

interface ProfilePageProps extends BlockOwnProps {
  userName: string;
  avatarSrc: string;
  profileFields: FieldProps[];
  passwordFields: FieldProps[];
  backHref: string;
  onLogout: () => void;
}

const PROFILE_KEYS = ['first_name', 'second_name', 'display_name', 'login', 'email', 'phone'] as const;

const buildProfileFields = (user: User): FieldProps[] => [
  { label: 'Почта', name: 'email', type: 'email', value: user.email },
  { label: 'Логин', name: 'login', value: user.login },
  { label: 'Имя', name: 'first_name', value: user.first_name },
  { label: 'Фамилия', name: 'second_name', value: user.second_name },
  { label: 'Имя в чате', name: 'display_name', value: user.display_name ?? '' },
  { label: 'Телефон', name: 'phone', type: 'tel', value: user.phone },
].map((field) => ({ ...field, variant: 'profile' as const }));

const passwordFields: FieldProps[] = [
  { label: 'Старый пароль', name: 'old_password', type: 'password', autocomplete: 'current-password' },
  { label: 'Новый пароль', name: 'new_password', type: 'password', autocomplete: 'new-password' },
].map((field) => ({ ...field, variant: 'profile' as const }));

/** Данные пользователя из Store → props страницы */
const mapUserToProps = (user: User | null) => ({
  userName: user ? user.display_name || `${user.first_name} ${user.second_name}` : '',
  avatarSrc: getResourceUrl(user?.avatar),
  profileFields: user ? buildProfileFields(user) : [],
});

export class ProfilePage extends Block<ProfilePageProps> {
  protected template = template;

  private unsubscribe: (() => void) | null = null;

  private isLoggingOut = false;

  private formHandlers: Record<string, (values: FormValues, form: HTMLFormElement) => Promise<void>> = {
    avatar: (_values, form) => this.saveAvatar(form),
    profile: (values) => this.saveProfile(values),
    password: (values, form) => this.savePassword(values, form),
  };

  protected events: EventListType = {
    submit: (event: Event) =>
      submitForm(event, this.children.filter(isValidatable), (values, form) =>
        this.formHandlers[form.name]?.(values, form),
      ),
    change: (event: Event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.type === 'file') {
        const file = input.files?.[0];
        showStatus(this.refs.avatarStatus, file ? `Выбран файл: ${file.name}` : '', 'success');
      }
    },
  };

  constructor() {
    super({
      ...mapUserToProps(store.getState().user),
      passwordFields,
      backHref: Routes.Messenger,
      onLogout: () => {
        void this.logout();
      },
    });
  }

  protected componentDidMount(): void {
    this.unsubscribe = store.subscribe(() => this.setProps(mapUserToProps(store.getState().user)));
  }

  protected componentWillUnmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private async logout(): Promise<void> {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    showStatus(this.refs.logoutStatus, '');

    try {
      await AuthController.logout();
    } catch (error) {
      showStatus(this.refs.logoutStatus, getErrorText(error));
    } finally {
      this.isLoggingOut = false;
    }
  }

  private async saveAvatar(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const file = formData.get('avatar');

    if (!(file instanceof File) || file.size === 0) {
      showStatus(this.refs.avatarStatus, 'Сначала выберите картинку');
      return;
    }

    try {
      await UserController.updateAvatar(formData);
      showStatus(this.refs.avatarStatus, 'Аватар обновлён', 'success');
    } catch (error) {
      showStatus(this.refs.avatarStatus, getErrorText(error));
    }
  }

  private async saveProfile(values: FormValues): Promise<void> {
    try {
      await UserController.updateProfile(pickStrings(values, PROFILE_KEYS));
      // Store обновился → страница перерисовалась, refs указывают на новую разметку
      showStatus(this.refs.profileStatus, 'Данные сохранены', 'success');
    } catch (error) {
      showStatus(this.refs.profileStatus, getErrorText(error));
    }
  }

  private async savePassword(values: FormValues, form: HTMLFormElement): Promise<void> {
    const { old_password: oldPassword, new_password: newPassword } = pickStrings(values, [
      'old_password',
      'new_password',
    ]);

    try {
      await UserController.changePassword({ oldPassword, newPassword });
      this.children
        .filter((child): child is Field => child instanceof Field && form.contains(child.element()))
        .forEach((field) => field.clear());
      showStatus(this.refs.passwordStatus, 'Пароль изменён', 'success');
    } catch (error) {
      showStatus(this.refs.passwordStatus, getErrorText(error));
    }
  }
}
