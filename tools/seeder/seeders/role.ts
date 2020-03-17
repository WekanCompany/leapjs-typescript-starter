import { RoleModel } from 'app/role/models/role';
import { Logger } from '@leapjs/common';
import roles from '../data/roles';

async function RoleSeeder(): Promise<boolean> {
  return RoleModel.insertMany(roles)
    .then(() => {
      Logger.log('Roles seeded successfully', 'LeapApplication');
      return true;
    })
    .catch((error) => {
      return Promise.reject(new Error(`Failed seeding roles - ${error}`));
    });
}

export default RoleSeeder;
