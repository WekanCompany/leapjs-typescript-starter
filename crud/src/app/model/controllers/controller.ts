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
import { <%= modelName %> } from 'app/<%= modelNameLower %>/models/<%= modelNameLower %>';
import Authentication from 'common/middleware/auth';
import <%= modelName %>Service from 'app/<%= modelNameLower %>/services/<%= modelNameLower %>';
import Validator from 'common/middleware/validator';
import { buildResultWithPagination } from '@leapjs/crud';

@Controller('/<%= modelNameLowerPlural %>')
class <%= modelName %>Controller {
  @inject(<%= modelName %>Service) private readonly <%= modelNameLower %>Service!: <%= modelName %>Service;

  @Post()
  @UseBefore(Validator.validate(<%= modelName %>, ['create']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async create<%= modelName %>(
    @Body() <%= modelNameLower %>: <%= modelName %>,
    @Res() res: Response,
  ): Promise<any> {
    return this.<%= modelNameLower %>Service
      .createOne(<%= modelNameLower %>)
      .then(
        (result: any): Response => {
          return res
            .status(HttpStatus.CREATED)
            .json({ data: { <%= modelNameLower %>: { _id: result._id } } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Patch('/:id')
  @UseBefore(Validator.validate(<%= modelName %>, ['update']))
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async update<%= modelName %>(
    @Param('id') id: string,
    @Body() <%= modelNameLower %>: <%= modelName %>,
    @Res() res: Response,
  ): Promise<any> {
    return this.<%= modelNameLower %>Service
      .updateOne({ id }, <%= modelNameLower %>)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { <%= modelNameLower %>: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Get('/:id')
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async get<%= modelName %>(
    @Param('id') id: string,
    @QueryParam('fields') fields: string,
    @Res() res: Response,
  ): Promise<any> {
    return this.<%= modelNameLower %>Service
      .getOne({ _id: id }, fields)
      .then(
        (result: any): Response => {
          return res.status(HttpStatus.OK).json({ data: { <%= modelNameLower %>: result } });
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Get()
  @UseBefore(accessControl())
  @UseBefore(Authentication)
  public async get<%= modelNamePlural %>(
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

    return this.<%= modelNameLower %>Service
      .getMany(sortByArr, {}, fields, page, perPage)
      .then(
        (results: any): Response => {
          return res
            .status(HttpStatus.OK)
            .json(buildResultWithPagination('<%= modelNameLowerPlural %>', results, page, perPage));
        },
      )
      .catch((error: any): any => Promise.reject(error));
  }

  @Delete('/:id')
  // @UseBefore(Authentication)
  public async delete<%= modelName %>(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    return this.<%= modelNameLower %>Service
      .deleteOne(id)
      .then((): void => {
        return res.status(HttpStatus.NO_CONTENT).end();
      })
      .catch((error: any): any => Promise.reject(error));
  }
}

export default <%= modelName %>Controller;
