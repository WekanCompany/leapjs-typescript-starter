import {
  InternalServerException,
  getRandom,
  pad,
  injectable,
  inject,
} from '@leapjs/common';
import { CrudService } from '@leapjs/crud';
import { hash } from 'argon2';
import { USER_CREATE_FAILED } from 'resources/strings/app/user';
import { UserStatus } from 'common/constants';
import RoleService from 'app/role/services/role';
import { configuration } from 'configuration/manager';
import { sendVerificationMail } from 'common/services/messaging';
import { User, UserModel } from '../models/user';

@injectable()
class UserService extends CrudService<User> {
  public constructor(
    @inject(RoleService) private readonly roleService: RoleService,
  ) {
    super(UserModel, 'firstName lastName email profileImageUrl status', {});
  }

  public async createOne(user: User): Promise<any> {
    await this.roleService.getOne({ _id: user.role });

    const random = getRandom(0, 10000);
    const verificationCode = pad(String(random), '0', 4);
    if (verificationCode === undefined) {
      throw new InternalServerException(USER_CREATE_FAILED);
    }

    const newUser = user;
    newUser.password = await hash(user.password);
    newUser.verificationCode = verificationCode;

    const savedUser = await new UserModel(newUser).save();

    if (savedUser.status === 0 && savedUser.verificationCode !== undefined) {
      sendVerificationMail([
        savedUser.email,
        savedUser.verificationCode,
        savedUser.firstName,
        configuration.name,
      ]);
    }
    return savedUser;
  }

  public async updateOne(conditions: {}, user: Partial<User>): Promise<any> {
    const updatedUser = user;
    if (user.password !== undefined) {
      updatedUser.password = await hash(user.password);
      updatedUser.status = UserStatus.VERIFIED;
    }
    return UserModel.findOneAndUpdate(conditions, updatedUser, {
      fields: {
        firstName: 1,
        lastName: 1,
        email: 1,
        profileImageUrl: 1,
        status: 1,
      },
      new: true,
    })
      .lean()
      .exec();
  }
}

export default UserService;
