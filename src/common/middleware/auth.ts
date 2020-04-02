import { Response, NextFunction } from 'express';
import { UnauthorizedException } from '@leapjs/common';
import { Middleware } from '@leapjs/router';
import passport from 'passport';
import {
  AUTH_TOKEN_INVALID,
  AUTH_TOKEN_EMPTY,
  AUTH_TOKEN_EXPIRED,
} from 'resources/strings/middleware/authentication';

@Middleware()
class Authentication {
  public before(req: any, res: Response, next: NextFunction): any {
    return passport.authenticate(
      'jwt',
      { session: false },
      (error: Error, decodedToken: any, info: any): any => {
        if (error) {
          return next(new UnauthorizedException(error.message));
        }
        if (!decodedToken) {
          let message = AUTH_TOKEN_INVALID;
          if (info !== undefined && info.message === 'No auth token') {
            message = AUTH_TOKEN_EMPTY;
          }
          if (info !== undefined && info.message === 'jwt expired') {
            message = AUTH_TOKEN_EXPIRED;
          }
          return next(new UnauthorizedException(message));
        }
        req.decodedToken = decodedToken;
        return next();
      },
    )(req, res, next);
  }
}

export default Authentication;
