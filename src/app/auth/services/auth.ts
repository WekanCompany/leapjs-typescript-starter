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
      const expiry: Date | undefined = addToDate(
        new Date(),
        'minute',
        configuration.authentication.token.expiry,
      );

      if (expiry === undefined || !moment(expiry).isValid()) {
        throw new InternalServerException(GENERATE_TOKEN_FAILED);
      }

      return sign(
        stringify({
          email,
          exp: expiry.getTime() / 1000,
        }),
        configuration.authentication.token.secret,
        { algorithm: 'HS512' },
      );
    } catch (error) {
      throw new InternalServerException(GENERATE_TOKEN_FAILED);
    }
  }

  public async isEqual(user: User, savedUser: User): Promise<any> {
    return verify(savedUser.password, user.password)
      .then(
        async (result: any): Promise<any> => {
          if (result) {
            return true;
          }
          if (!savedUser.tmpPassword) {
            throw new UnauthorizedException(INVALID_CREDENTAILS);
          }
          return verify(savedUser.tmpPassword, user.password);
        },
      )
      .then(
        async (result: any): Promise<any> => {
          if (result) {
            return this.generateTokens(user.email);
          }
          throw new UnauthorizedException(INVALID_CREDENTAILS);
        },
      )
      .catch(
        (error: any): Promise<any> => {
          return Promise.reject(error);
        },
      );
  }

  public async authenticate(user: User): Promise<any> {
    return this.userService
      .getOne(
        {
          email: user.email,
          status: {
            $in: [
              UserStatus.NOT_VERIFIED,
              UserStatus.VERIFIED,
              UserStatus.RESET_PASSWORD_ON_LOGIN,
            ],
          },
        },
        'firstName lastName email profileImageUrl password tmpPassword status',
      )
      .then(
        async (res: any): Promise<{}> => {
          const accessToken = await this.isEqual(user, res).catch(
            (error: any): Promise<any> => {
              throw new HttpException(error.status, error.message);
            },
          );
          const result = res;
          result.accessToken = accessToken;
          delete result.password;
          delete result.tmpPassword;
          return result;
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
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
      .then(async (res) => {
        const result = res;
        result.accessToken = this.generateTokens(result.email);
        return result;
      })
      .catch((error) => Promise.reject(error));
  }

  public async resetPassword(email: string): Promise<any> {
    return this.userService
      .getOne({
        email,
        status: {
          $in: [UserStatus.VERIFIED, UserStatus.RESET_PASSWORD_ON_LOGIN],
        },
      })
      .then(
        async (result: any): Promise<void> => {
          const tmpPassword = crypto.randomBytes(6).toString('hex');
          const tmpPasswordHash = await hash(tmpPassword);
          this.userService.updateOne(
            { _id: result._id },
            {
              tmpPassword: tmpPasswordHash,
              status: UserStatus.RESET_PASSWORD_ON_LOGIN,
            },
          );
          sendResetPasswordMail([result.email, tmpPassword, result.firstName]);
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  public async sendOtp(id: string): Promise<void> {
    return this.userService
      .getOne({ _id: id }, 'email verificationCode')
      .then(
        async (result: any): Promise<void> => {
          if (result.verificationCode !== null) {
            sendVerificationMail([
              result.email,
              result.verificationCode,
              result.firstName,
              configuration.name,
            ]);
          }
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  public async verify(id: string, verificationCode: string): Promise<any> {
    return this.userService
      .updateOne({ _id: id, verificationCode }, { status: UserStatus.VERIFIED })
      .then((res: any) => {
        const result = res;
        result.accessToken = this.generateTokens(result.email);
        result.status = UserStatus.VERIFIED;
        return result;
      })
      .catch((error: any) => Promise.reject(error));
  }
}

export default AuthService;
