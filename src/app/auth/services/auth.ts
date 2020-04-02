import {
  GENERATE_TOKEN_FAILED,
  INVALID_CREDENTAILS,
} from 'resources/strings/app/auth';
import { User } from 'app/user/models/user';
import { UserStatus } from 'common/constants';
import { hash, verify } from 'argon2';
import { configuration } from 'configuration/manager';
import crypto from 'crypto';
import { sign, decode, verify as verifyJwt } from 'jsonwebtoken';
import UserService from 'app/user/services/user';
import {
  HttpException,
  UnauthorizedException,
  InternalServerException,
  addToDate,
  injectable,
  inject,
  Logger,
  ForbiddenException,
} from '@leapjs/common';
import stringify from 'fast-json-stable-stringify';
import {
  sendVerificationMail,
  sendResetPasswordMail,
} from 'common/services/messaging';
import moment from 'moment';

@injectable()
class AuthService {
  @inject(UserService) private readonly userService!: UserService;
  @inject(Logger) private readonly logger!: Logger;

  public generateTokens(email: string): string {
    try {
      const expiry = addToDate(
        new Date(),
        'minute',
        configuration.authentication.token.expiry,
      );
      if (expiry === undefined || !moment(expiry).isValid()) {
        throw new InternalServerException(GENERATE_TOKEN_FAILED);
      }
      return sign(
        stringify({ email, exp: expiry.getTime() / 1000 }),
        configuration.authentication.token.secret,
        { algorithm: 'HS512' },
      );
    } catch (error) {
      throw new InternalServerException(GENERATE_TOKEN_FAILED);
    }
  }

  public async isEqual(user: User, savedUser: User): Promise<any> {
    let result = await verify(savedUser.password, user.password);
    if (!result) {
      if (savedUser.tmpPassword) {
        result = await verify(savedUser.tmpPassword, user.password);
      }
    }
    if (!result) {
      throw new UnauthorizedException(INVALID_CREDENTAILS);
    }
    return this.generateTokens(user.email);
  }

  public async authenticate(user: User): Promise<any> {
    const result: any = await this.userService.getOne(
      { email: user.email },
      'firstName lastName email profileImageUrl password tmpPassword status',
    );
    console.log(result);
    const accessToken = await this.isEqual(user, result).catch(
      (error: any): Promise<any> => {
        throw new HttpException(error.status, error.message);
      },
    );
    result.accessToken = accessToken;
    delete result.password;
    delete result.tmpPassword;
    return result;
  }

  public async refresh(accessToken: string): Promise<any> {
    try {
      verifyJwt(accessToken, configuration.authentication.token.secret);
    } catch (error) {
      if (error.message !== 'jwt expired') {
        return Promise.reject(
          new ForbiddenException(`Failed to refresh token - ${error.message}`),
        );
      }
      this.logger.log(`${error.message} - Refresh token called`);
    }
    const decodedToken: any = decode(accessToken);
    if (!decodedToken) {
      throw new Error('Access token is invalid');
    }
    return this.userService
      .getOne({ email: decodedToken.email })
      .then(async (res: any) => {
        const result = res;
        result.accessToken = this.generateTokens(result.email);
        return result;
      })
      .catch((error) => Promise.reject(error));
  }

  public async resetPassword(email: string): Promise<any> {
    const user: any = await this.userService.getOne({ email });
    if (user) {
      const tmpPassword = crypto.randomBytes(6).toString('hex');
      const tmpPasswordHash = await hash(tmpPassword);
      this.userService.updateOne(
        { _id: user._id },
        {
          tmpPassword: tmpPasswordHash,
          status: UserStatus.RESET_PASSWORD_ON_LOGIN,
        },
      );
      sendResetPasswordMail([user.email, tmpPassword, user.firstName]);
    }
  }

  public async sendOtp(id: string): Promise<void> {
    const user: any = await this.userService.getOne(
      { _id: id },
      'email verificationCode',
    );
    if (user.verificationCode !== null) {
      sendVerificationMail([
        user.email,
        user.verificationCode,
        user.firstName,
        configuration.name,
      ]);
    }
  }

  public async verify(id: string, verificationCode: string): Promise<any> {
    const result = await this.userService.updateOne(
      { _id: id, verificationCode },
      { status: UserStatus.VERIFIED },
    );
    result.accessToken = this.generateTokens(result.email);
    result.status = UserStatus.VERIFIED;
    return result;
  }
}

export default AuthService;
