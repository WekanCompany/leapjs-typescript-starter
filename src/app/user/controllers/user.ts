import { inject } from '@leapjs/common';
import Authentication from 'common/middleware/auth';
import validate from 'common/middleware/validator';
import { accessControl } from '@leapjs/access-control';
import { Crud, CrudController } from '@leapjs/crud';
import { User } from '../models/user';
import UserService from '../services/user';

@Crud({
  baseRoute: '/users',
  model: User,
  methods: {
    createOne: ['', { before: [validate(User, ['create'])] }],
    createMany: false,
    updateOne: [
      '/:id',
      { before: [Authentication, accessControl(), validate(User, ['update'])] },
    ],
    replaceOne: false,
    getOne: ['/:id', { before: [Authentication, accessControl()] }],
    getMany: ['', { before: [Authentication, accessControl()] }],
    deleteOne: false,
  },
})
class UserController extends CrudController<User> {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }
}

export default UserController;
