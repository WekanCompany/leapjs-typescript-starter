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
import Validator from 'common/middleware/validator';
import INVALID_SORT_VALUE from 'resources/strings/app/common';
import { buildResultWithPagination } from '@leapjs/crud';

@Controller('/users')
class UserController {
  @inject(UserService) private readonly userService!: UserService;

  @Post()
  @UseBefore(Validator.validate(User, ['create']))
  public async createUser(
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    return this.userService
      .createOne(user)
      .then(
        (result: any): Response => {
          return res
            .status(HttpStatus.CREATED)
            .json({ data: { user: { _id: result._id } } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Patch('/me')
  @UseBefore(Validator.validate(User, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async updateSelf(
    @Req() req: any,
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    return this.userService
      .updateOne({ email: req.decodedToken.email }, user)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Patch('/:id')
  @UseBefore(Validator.validate(User, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async updateUser(
    @Param('id') id: string,
    @Body() user: User,
    @Res() res: Response,
  ): Promise<any> {
    return this.userService
      .updateOne({ _id: id }, user)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
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
    return this.userService
      .getOne({ _id: id }, fields, expand)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { user: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Get()
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async getUsers(
    @QueryParam('fields') fields: string,
    @QueryParam('sort') sort: string,
    @QueryParam('offset') offset: number,
    @QueryParam('limit') limit: number,
    @QueryParam('expand') expand: string,
    @Res() res: Response,
  ): Promise<any> {
    const page =
      offset === undefined && limit !== undefined ? 0 : Number(offset);
    const perPage =
      limit === undefined && offset !== undefined ? 10 : Number(limit);
    const sortBy = sort === undefined ? 'id|asc' : sort;

    const sortByArr = sortBy.split('|');

    if (!['asc', 'desc'].includes(sortByArr[1])) {
      throw new ValidationException(INVALID_SORT_VALUE);
    }

    return this.userService
      .getMany(sortByArr, {}, fields, page, perPage, expand)
      .then(
        (results: any): Response => {
          return res
            .status(HttpStatus.OK)
            .json(buildResultWithPagination(results, page, perPage));
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Delete('/:id')
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async deleteUser(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    return this.userService
      .deleteOne(id)
      .then((): void => {
        return res.status(HttpStatus.NO_CONTENT).end();
      })
      .catch((error: any): any => Promise.reject(error));
  }
}

export default UserController;
