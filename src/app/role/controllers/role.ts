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
import INVALID_SORT_VALUE from 'resources/strings/app/common';
import { Response } from 'express';
import { Role } from 'app/role/models/role';
import Authentication from 'common/middleware/auth';
import RoleService from 'app/role/services/role';
import Validator from 'common/middleware/validator';
import { buildResultWithPagination } from '@leapjs/crud';

@Controller('/roles')
class RoleController {
  @inject(RoleService) private readonly roleService!: RoleService;

  @Post()
  @UseBefore(Validator.validate(Role, ['create']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async createRole(
    @Body() role: Role,
    @Res() res: Response,
  ): Promise<any> {
    return this.roleService
      .createOne(role)
      .then(
        (result: any): Response => {
          return res
            .status(HttpStatus.CREATED)
            .json({ data: { role: { _id: result._id } } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Patch('/:id')
  @UseBefore(Validator.validate(Role, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async updateRole(
    @Param('id') id: string,
    @Body() role: Role,
    @Res() res: Response,
  ): Promise<any> {
    return this.roleService
      .updateOne({ id }, role)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { role: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Get('/:id')
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async getRole(
    @Param('id') id: string,
    @QueryParam('fields') fields: string,
    @Res() res: Response,
  ): Promise<any> {
    return this.roleService
      .getOne({ _id: id }, fields)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { role: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Get()
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async getRoles(
    @QueryParam('fields') fields: string,
    @QueryParam('sort') sort: string,
    @QueryParam('offset') offset: number,
    @QueryParam('limit') limit: number,
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

    return this.roleService
      .getMany(sortByArr, {}, fields, page, perPage)
      .then(
        (results: any): Response => {
          return res
            .status(HttpStatus.OK)
            .json(buildResultWithPagination('roles', results, page, perPage));
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Delete('/:id')
  @UseBefore(Authentication)
  public async deleteRole(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    return this.roleService
      .deleteOne(id)
      .then((): void => {
        return res.status(HttpStatus.NO_CONTENT).end();
      })
      .catch((error: any): any => Promise.reject(error));
  }
}

export default RoleController;
