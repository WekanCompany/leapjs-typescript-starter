import {
  Controller,
  Post,
  Res,
  Body,
  UseBefore,
  Param,
  Header,
} from '@leapjs/router';
import { HttpStatus, inject } from '@leapjs/common';
import { Response } from 'express';
import { User } from 'app/user/models/user';
import validator from 'common/middleware/validator';
import AuthService from '../services/auth';

@Controller('/auth/users')
class AuthController {
  @inject(AuthService) private readonly service!: AuthService;

  @Post('/login')
  @UseBefore(validator.validate(User, ['auth']))
  public async login(
    @Body() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    return this.service
      .authenticate(user)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  @Post('/refresh')
  public async refresh(
    @Header('authorization') authorization: string,
    @Res() res: Response,
  ): Promise<Response> {
    return this.service
      .refresh(authorization.split(' ')[1])
      .then(
        async (result: any): Promise<{}> => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  @Post('/reset-password')
  public async resetPassword(
    @Body() req: any,
    @Res() res: Response,
  ): Promise<Response> {
    return this.service
      .resetPassword(req.email)
      .then(
        async (): Promise<any> => {
          return res.status(HttpStatus.NO_CONTENT).end();
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  @Post('/:id/verification-code')
  public async sendVerificationCode(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    return this.service
      .sendOtp(id)
      .then(
        async (): Promise<void> => {
          return res.status(HttpStatus.NO_CONTENT).end();
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  @Post('/:id/verify')
  public async verify(
    @Param('id') id: string,
    @Body() req: any,
    @Res() res: Response,
  ): Promise<Response> {
    return this.service
      .verify(id, req.verificationCode)
      .then(
        async (result: any): Promise<{}> => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }
}

export default AuthController;
