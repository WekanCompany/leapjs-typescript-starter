import 'module-alias/register';
import 'reflect-metadata';
import { Logger, expandObject } from '@leapjs/common';
import { configuration } from 'configuration/manager';
import bootstrap from 'app/app';
import { isValid } from 'configuration/helpers';
import RoleSeeder from './seeders/role';
import UserSeeder from './seeders/user';
import seeder from './seeders/init';

function main(): void {
  configuration
    .init()
    .then((status: string): any => {
      Logger.log(`Setting up environment ${status}`, 'ConfigurationManager');
      return isValid(configuration);
    })
    .then((status: any): any => {
      Logger.log(`Initializing settings ${status}`, 'ConfigurationManager');
      Logger.log(`Connecting to the database ${status}`, 'LeapApplication');
      bootstrap(configuration, false);
      Logger.log(`Seeding started ...`, 'LeapApplication');
      return seeder([RoleSeeder, UserSeeder]);
    })
    .then(() => {
      Logger.log(`Seeding done`, 'LeapApplication');
      process.exit(0);
    })
    .catch((error): void => {
      Logger.error(expandObject(error), '', 'LeapApplication');
      process.exit(0);
    });
}

main();
