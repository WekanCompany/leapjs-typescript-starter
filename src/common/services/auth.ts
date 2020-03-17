import { inject, UnauthorizedException, injectable } from '@leapjs/common';
import passport from 'passport';
import { Strategy as JWTStrategy } from 'passport-jwt';
import { configuration } from 'configuration/manager';
import UserService from 'app/user/services/user';
import { UserStatus } from 'common/constants';
import {
  AUTH_TOKEN_INVALID,
  ACCOUNT_NOT_VERIFIED,
} from 'resources/strings/middleware/authentication';

@injectable()
class Authentication {
  @inject(UserService) private readonly userService!: UserService;

  public async init(): Promise<void> {
    passport.use(await this.strategy());
  }

  protected async strategy(): Promise<JWTStrategy> {
    return new JWTStrategy(
      {
        jwtFromRequest: (req): any =>
          String(req.headers.authorization).split(' ')[1],
        secretOrKey: configuration.authentication.token.secret,
      },
      (jwtPayload, done): any => {
        return this.userService
          .getOne({ email: jwtPayload.email }, 'role status', 'role')
          .then((user: any): any => {
            if (!user) {
              throw new UnauthorizedException(AUTH_TOKEN_INVALID);
            }
            const payload = jwtPayload;
            payload.user = user;
            if (user.role) {
              const { role } = user;
              payload.access = role.permissions;
            }
            if (user.status === UserStatus.NOT_VERIFIED) {
              throw new UnauthorizedException(ACCOUNT_NOT_VERIFIED);
            } else {
              return done(null, payload);
            }
          })
          .catch((error: any): any => {
            return done(error);
          });
      },
    );
  }
}

export default Authentication;
