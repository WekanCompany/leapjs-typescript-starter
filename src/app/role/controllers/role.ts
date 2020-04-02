import { inject } from '@leapjs/common';
import Authentication from 'common/middleware/auth';
import validate from 'common/middleware/validator';
import { accessControl } from '@leapjs/access-control';
import { Crud, CrudController } from '@leapjs/crud';
import { UseBefore } from '@leapjs/router';
import { Role } from '../models/role';
import RoleService from '../services/role';

@Crud({
  baseRoute: '/roles',
  model: Role,
  methods: {
    createOne: ['/', { before: [validate(Role, ['create'])] }],
    createMany: ['/bulk', { before: [] }],
    updateOne: ['/:id', { before: [validate(Role, ['update'])] }],
    replaceOne: ['/:id', { before: [validate(Role, ['create'])] }],
    getOne: ['/:id', { before: [] }],
    getMany: ['/', { before: [] }],
    deleteOne: ['/:id', { before: [] }],
  },
})
@UseBefore(accessControl())
@UseBefore(Authentication)
class RoleController extends CrudController<Role> {
  constructor(@inject(RoleService) service: RoleService) {
    super(service);
  }
}

export default RoleController;
