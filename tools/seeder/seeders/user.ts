/* eslint-disable no-param-reassign */
import { RoleModel } from 'app/role/models/role';
import { Logger } from '@leapjs/common';
import { UserModel } from 'app/user/models/user';
import { hash } from 'argon2';
import roles from '../data/roles';
import users from '../data/user';

async function UserSeeder(): Promise<boolean> {
  return RoleModel.findOne({ name: roles[0].name })
    .then(async (adminRole: any) => {
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      if (defaultPassword && defaultPassword !== '') {
        const passwordHash = await hash(defaultPassword);
        users.forEach((user) => {
          user.role = adminRole._id;
          user.email = defaultEmail || '';
          user.password = passwordHash;
        });
      } else {
        throw new Error('Password cannot be empty');
      }
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
