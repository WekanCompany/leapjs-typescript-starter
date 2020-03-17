/* eslint-disable no-param-reassign */
import { RoleModel } from 'app/role/models/role';
import { Logger } from '@leapjs/common';
import { UserModel } from 'app/user/models/user';
import roles from '../data/roles';
import users from '../data/user';

async function UserSeeder(): Promise<boolean> {
  return RoleModel.findOne({ name: roles[0].name })
    .then((adminRole: any) => {
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      users.forEach((user) => {
        user.role = adminRole._id;
        user.email = defaultEmail || '';
        user.password = defaultPassword || '';
      });
      return UserModel.insertMany(users);
    })
    .then(() => {
      Logger.log('Users seeded successfully', 'LeapApplication');
      return true;
    })
    .catch((error: any) => {
      return Promise.reject(new Error(`Failed seeding users - ${error}`));
    });
}

export default UserSeeder;
