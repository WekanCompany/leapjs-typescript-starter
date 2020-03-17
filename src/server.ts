import 'module-alias/register';
import 'reflect-metadata';
import { Logger, expandObject } from '@leapjs/common';
import { configuration } from 'configuration/manager';
import bootstrap from 'app/app';
import { isValid } from 'configuration/helpers';

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
      Logger.log(`Starting server on ${configuration.port}`, 'LeapApplication');
      bootstrap(configuration);
      Logger.log(`Up and running`, 'LeapApplication');
    })
    .catch((error): void => {
      Logger.error(expandObject(error), '', 'LeapApplication');
      process.exit(0);
    });
}

process.on('uncaughtException', (error): void => {
  Logger.error(expandObject(error), '', 'LeapApplication');
  process.exit(1);
});

process.on('unhandledRejection', (error): void => {
  Logger.error(expandObject(error), '', 'LeapApplication');
  process.exit(1);
});

main();
