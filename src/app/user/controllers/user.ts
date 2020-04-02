import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  Res,
  UseBefore,
  Delete,
} from '@leapjs/router';
import { accessControl } from '@leapjs/access-control';
import { HttpStatus, ValidationException, inject } from '@leapjs/common';
import { Response } from 'express';
import { User } from 'app/user/models/user';
import Authentication from 'common/middleware/auth';
import UserService from 'app/user/services/user';
import validate from 'common/middleware/validator';
import INVALID_SORT_VALUE from 'resources/strings/app/common';
import { buildResultWithPagination } from '@leapjs/crud';

@Controller('/users')
class UserController {
  @inject(UserService) private readonly userService!: UserService;

  @Post()
  @UseBefore(validate(User, ['create']))
  public async createUser(
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    const savedUser = await this.userService.createOne(user);
    return res
      .status(HttpStatus.CREATED)
      .json({ data: { user: { _id: savedUser._id } } });
  }

  @Patch('/me')
  @UseBefore(validate(User, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async updateSelf(
    @Req() req: any,
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    const updatedUser = await this.userService.updateOne(
      { _id: req.decodedToken.user._id },
      user,
    );
    return res.status(HttpStatus.OK).json({ data: { user: updatedUser } });
  }

  @Patch('/:id')
  @UseBefore(validate(User, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async updateUser(
    @Param('id') id: string,
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    const updatedUser = await this.userService.updateOne({ _id: id }, user);
    return res.status(HttpStatus.OK).json({ data: { user: updatedUser } });
  }

  @Get('/:id')
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async getUser(
    @Param('id') id: string,
    @QueryParam('fields') fields: string,
    @QueryParam('expand') expand: string,
    @Res() res: Response,
  ): Promise<any> {
    const user = this.userService.getOne({ _id: id }, fields, expand);
    return res.status(HttpStatus.OK).json({ data: { user } });
  }

  @Get()
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async getUsers(
    @QueryParam('fields') fields: string,
    @QueryParam('sort') sort = 'id|asc',
    @QueryParam('page') page = 0,
    @QueryParam('perPage') perPage = 10,
    @QueryParam('expand') expand: string,
    @Res() res: Response,
  ): Promise<any> {
    const sortByArr = sort.split('|');
    if (!['asc', 'desc'].includes(sortByArr[1])) {
      throw new ValidationException(INVALID_SORT_VALUE);
    }
    const users = this.userService.getMany(
      sortByArr,
      {},
      fields,
      page,
      perPage,
      expand,
    );
    return res
      .status(HttpStatus.OK)
      .json(buildResultWithPagination('users', users, page, perPage));
  }

  @Delete('/:id')
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async deleteUser(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.userService.deleteOne(id);
    return res.status(HttpStatus.NO_CONTENT).end();
  }
}

export default UserController;
