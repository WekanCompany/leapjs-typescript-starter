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
import { express as swagger } from 'swagger-express-ts';
import { static as serveStatic } from 'express';

async function bootstrap(
  configuration: Configuration,
  listen = true,
): Promise<void> {
  const application: LeapApplication = new LeapApplication();

  const server = application.create(new ExpressAdapter(), {
    prefix: 'v1',
    corsOptions: {
      origin: configuration.corsWhitelistedDomains,
      credentials: true,
    },
    controllers: [UserController, AuthController, RoleController],
    beforeMiddlewares: [helmet(), json(acFilterAttributes)],
    afterMiddlewares: [ErrorHandler],
  });

  application.connectToDatabase(
    new MongoDB(configuration.database.host, configuration.database.name),
  );

  if (listen) {
    configuration.setContext(application);

    const container = application.getContainer();
    container.resolve<Authentication>(Authentication).init();

    const mailer = new Mail(Sendgrid, container);
    mailer.init(configuration.mailer.apiKey);
    configuration.mailer.setInstance(mailer);

    server.use('/api-docs/', serveStatic('documentation'));
    server.use(
      '/api-docs/documentation/assets',
      serveStatic('node_modules/swagger-ui-dist'),
    );
    server.use(
      swagger({
        definition: {
          info: {
            title: `${configuration.name} API Documentation`,
            version: '1.0.0',
          },
          basePath: '/v1',
          schemes: ['http'],
          securityDefinitions: {
            apiKey: {
              in: 'header',
              name: 'Authorization',
              type: 'apiKey',
            },
          },
        },
      }),
    );

    server.listen(configuration.port);
  }
}

export default bootstrap;
