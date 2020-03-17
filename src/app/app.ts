import { LeapApplication, MongoDB } from '@leapjs/core';
import { ExpressAdapter } from '@leapjs/router';
import { acFilterAttributes } from '@leapjs/access-control';
import { json } from 'express-mung';
import helmet from 'helmet';
import UserController from 'app/user/controllers/user';
import AuthController from 'app/auth/controllers/auth';
import RoleController from 'app/role/controllers/role';
import Authentication from 'common/services/auth';
import ErrorHandler from 'common/middleware/error-handler';
import { Configuration } from 'configuration/manager';
import { Mail, Sendgrid } from '@leapjs/messaging';

function bootstrap(configuration: Configuration, listen = true): void {
  const application: LeapApplication = new LeapApplication();

  const server = application.create(new ExpressAdapter(), {
    prefix: 'v1',
    whitelist: configuration.corsWhitelistedDomains,
    controllers: [UserController, AuthController, RoleController],
    beforeMiddlewares: [helmet(), json(acFilterAttributes)],
    afterMiddlewares: [ErrorHandler],
  });

  // eslint-disable-next-line no-param-reassign
  configuration.setContext(application);

  const container = application.getContainer();

  container.resolve<Authentication>(Authentication).init();

  application.connectToDatabase(
    new MongoDB(configuration.database.host, configuration.database.name),
  );

  const mailer = new Mail(Sendgrid, container);
  mailer.init(configuration.mailer.apiKey);
  configuration.mailer.setInstance(mailer);

  if (listen) {
    server.listen(configuration.port);
  }
}

export default bootstrap;
