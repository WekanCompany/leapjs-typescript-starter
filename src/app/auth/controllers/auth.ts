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
import validate from 'common/middleware/validator';
import AuthService from '../services/auth';

@Controller('/auth/users')
class AuthController {
  @inject(AuthService) private readonly service!: AuthService;

  @Post('/login')
  @UseBefore(validate(User, ['auth']))
  public async login(
    @Body() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const userWithTokens = await this.service.authenticate(user);
    return res.status(HttpStatus.OK).json({ data: { user: userWithTokens } });
  }

  @Post('/refresh')
  public async refresh(
    @Header('authorization') authorization: string,
    @Res() res: Response,
  ): Promise<Response> {
    const userWithTokens = await this.service.refresh(
      authorization.split(' ')[1],
    );
    return res.status(HttpStatus.OK).json({ data: { user: userWithTokens } });
  }

  @Post('/reset-password')
  public async resetPassword(
    @Body() req: any,
    @Res() res: Response,
  ): Promise<void> {
    await this.service.resetPassword(req.email);
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  @Post('/:id/verification-code')
  public async sendVerificationCode(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.service.sendOtp(id);
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  @Post('/:id/verify')
  public async verify(
    @Param('id') id: string,
    @Body() req: any,
    @Res() res: Response,
  ): Promise<Response> {
    const userWithTokens = this.service.verify(id, req.verificationCode);
    return res.status(HttpStatus.OK).json({ data: { user: userWithTokens } });
  }
}

export default AuthController;
