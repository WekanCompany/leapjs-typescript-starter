import { IsDefined, IsEmail, IsUrl, MaxLength } from 'class-validator';
import { prop, post, Ref, index, getModelForClass } from '@typegoose/typegoose';
import {
  EMPTY_FIRST_NAME,
  INVALID_FIRST_NAME,
  EMPTY_LAST_NAME,
  INVALID_LAST_NAME,
  EMPTY_EMAIL,
  INVALID_EMAIL,
  EMPTY_PASSWORD,
  ROLE_MISSING,
  INVALID_PROFILE_IMAGE_URL,
} from 'resources/strings/app/user';
import { Role } from 'app/role/models/role';
import { mongoErrorHandler } from '@leapjs/common';
import { UserStatus } from 'common/constants';

@index({ email: 1 }, { unique: true })
@post('save', mongoErrorHandler('User'))
@post('findOneAndUpdate', mongoErrorHandler('User'))
class User {
  @prop()
  @IsDefined({ groups: ['create'], message: EMPTY_FIRST_NAME })
  @MaxLength(50, { always: true, message: INVALID_FIRST_NAME })
  public firstName?: string;

  @prop()
  @IsDefined({ groups: ['create'], message: EMPTY_LAST_NAME })
  @MaxLength(50, { always: true, message: INVALID_LAST_NAME })
  public lastName?: string;

  @prop({ required: true, unique: true })
  @IsDefined({ groups: ['auth', 'create'], message: EMPTY_EMAIL })
  @IsEmail({}, { always: true, message: INVALID_EMAIL })
  public email!: string;

  @prop({ required: true })
  @IsDefined({ groups: ['auth', 'create'], message: EMPTY_PASSWORD })
  public password!: string;

  @prop({ default: null })
  public tmpPassword?: string | null;

  @prop({ ref: Role })
  @IsDefined({ groups: ['create'], message: ROLE_MISSING })
  public role!: Ref<Role>;

  @prop({ default: null })
  @IsUrl(
    {
      /* eslint-disable */
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_tld: true,
      /* eslint-enable */
    },
    { always: true, message: INVALID_PROFILE_IMAGE_URL },
  )
  public profileImageUrl?: string;

  @prop({ default: null })
  public verificationCode?: string;

  @prop({ default: UserStatus.NOT_VERIFIED })
  public status?: number;
}

const UserModel = getModelForClass(User, {
  schemaOptions: {
    id: false,
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
});

export { User, UserModel };
