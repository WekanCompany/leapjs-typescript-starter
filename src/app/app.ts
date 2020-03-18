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
import { publisher, receiver } from '@leapjs/queue';
import { Logger } from '@leapjs/common';

async function bootstrap(
  configuration: Configuration,
  listen = true,
): Promise<void> {
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

  if (listen) {
    try {
      Logger.log(
        `Receiver connecting to amqp://${
          configuration.queue.url.split('@')[1]
        }`,
        'LeapApplication',
      );
      await receiver.init(configuration.queue.url);

      Logger.log(
        `Publisher connecting to amqp://${
          configuration.queue.url.split('@')[1]
        }`,
        'LeapApplication',
      );
      await publisher.init(configuration.queue.url);

      if (receiver.isConnected()) {
        receiver.createQueue(configuration.mailer.queue);
      }
      if (publisher.isConnected()) {
        receiver.listen(configuration.mailer.queue, Mail.defaultMailHandler);
      }
    } catch (error) {
      Logger.error(error, '', 'LeapApplication');
    }

    const mailer = new Mail(Sendgrid, container);
    mailer.setChannel(configuration.mailer.queue);
    mailer.init(configuration.mailer.apiKey);
    configuration.mailer.setInstance(mailer);

    server.listen(configuration.port);
  }
}

export default bootstrap;
