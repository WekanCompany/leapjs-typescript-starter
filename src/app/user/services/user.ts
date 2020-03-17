import {
  InternalServerException,
  NotFoundException,
  getRandom,
  pad,
  injectable,
  inject,
} from '@leapjs/common';
import { CrudService } from '@leapjs/crud';
import { hash } from 'argon2';
import {
  USER_NOT_FOUND,
  USER_NOT_CREATED,
  USER_CREATE_FAILED,
} from 'resources/strings/app/user';
import { UserStatus } from 'common/constants';
import RoleService from 'app/role/services/role';
import { Role } from 'app/role/models/role';
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
    return this.roleService
      .getOne({ _id: user.role })
      .then(
        async (role: Partial<Role>): Promise<string> => {
          if (!role) {
            throw new NotFoundException('Role not found');
          }
          return hash(user.password);
        },
      )
      .then(
        async (hashString: string): Promise<User> => {
          const random = getRandom(0, 10000);
          const verificationCode = pad(String(random), '0', 4);
          const newUser = user;
          newUser.password = hashString;
          newUser.verificationCode = verificationCode;
          if (newUser.verificationCode === undefined) {
            throw new InternalServerException(USER_CREATE_FAILED);
          }
          return new UserModel(newUser).save();
        },
      )
      .then(
        (result: User): User => {
          if (!result) {
            throw new InternalServerException(USER_NOT_CREATED);
          }

          if (result.status === 0 && result.verificationCode !== undefined) {
            sendVerificationMail([
              result.email,
              result.verificationCode,
              result.firstName,
              configuration.name,
            ]);
          }
          return result;
        },
      )
      .catch(
        (error: any): Promise<any> => {
          return Promise.reject(error);
        },
      );
  }

  public async updateOne(condition: {}, user: Partial<User>): Promise<any> {
    const updatedUser = user;
    if (user.password !== undefined) {
      updatedUser.password = await hash(user.password);
      updatedUser.status = UserStatus.VERIFIED;
    }
    return UserModel.findOneAndUpdate(condition, updatedUser, {
      fields: {
        firstName: 1,
        lastName: 1,
        email: 1,
        profileImageUrl: 1,
        status: 1,
      },
      new: true,
    })
      .exec()
      .then((result: any): {} => {
        if (!result) {
          throw new NotFoundException(USER_NOT_FOUND);
        }
        return result;
      })
      .catch((error: any): any => Promise.reject(error));
  }
}

export default UserService;
