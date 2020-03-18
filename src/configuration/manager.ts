import { IsDefined, Min, ValidateNested } from 'class-validator';
import dotenv from 'dotenv';
import { LeapApplication } from '@leapjs/core';
import { Logger as DefaultLogger } from '@leapjs/common';
import CustomLogger from 'common/services/logger';
import { logLevels } from 'common/constants';
import { Authentication, Token } from './classes/authentication';
import { Aws, SecretsManager } from './classes/aws';
import Database from './classes/database';
import Logger from './classes/logger';
import Messaging from './classes/messaging';
import Queue from './classes/queue';

class Configuration {
  public name = 'app';
  public application!: LeapApplication;

  @Min(1025, { message: 'Please provide a port number greater than 1024' })
  public port = 9000;

  public env = 'development';

  @IsDefined({
    message: 'Please provide a valid list of cors domains to whitelist',
  })
  public corsWhitelistedDomains = ['http://localhost'];

  @ValidateNested()
  public aws!: Aws;

  @ValidateNested()
  public authentication!: Authentication;

  @ValidateNested()
  public database!: Database;

  @ValidateNested()
  public queue!: Queue;

  @ValidateNested()
  public mailer!: Messaging;

  @ValidateNested()
  public logger!: Logger;

  public setContext(application: LeapApplication): void {
    this.application = application;
  }

  constructor() {
    this.aws = new Aws();
    this.aws.secrets = new SecretsManager();
    this.authentication = new Authentication();
    this.authentication.token = new Token();
    this.database = new Database();
    this.queue = new Queue();
    this.mailer = new Messaging();
    this.logger = new Logger();
  }

  public async init(): Promise<string> {
    if (dotenv.config().error) {
      throw new Error('Cannot find configuration file');
    }

    this.name = process.env.NAME || this.name;
    this.port = Number(process.env.PORT) || this.port;
    this.env = process.env.NODE_ENV || this.env;

    if (process.env.AWS_SECRETS_NAME !== '') {
      this.aws.secrets.region = process.env.AWS_SECRETS_REGION || '';
      this.aws.secrets.secretId = process.env.AWS_SECRETS_NAME || '';

      const secrets: any = await SecretsManager.getSecrets(
        this.aws.secrets.region,
        this.aws.secrets.secretId,
      );

      [this.authentication.token.secret, this.mailer.apiKey] = secrets;
    } else {
      this.authentication.token.secret = process.env.AUTH_TOKEN_SECRET || '';
      this.mailer.apiKey = process.env.MAILER_API_KEY || '';
    }

    this.authentication.token.expiry = Number(process.env.AUTH_TOKEN_EXPIRY);

    this.queue.url = process.env.QUEUE_URL || '';

    this.mailer.fromEmail = process.env.FROM_EMAIL || '';
    this.mailer.queue = process.env.MAIL_QUEUE || this.mailer.queue;

    this.corsWhitelistedDomains =
      process.env.CORS_WHITELIST !== ''
        ? String(process.env.CORS_WHITELIST)
            .trim()
            .split(',')
        : this.corsWhitelistedDomains;

    this.database.host = process.env.MONGODB_HOST || '';
    this.database.name = process.env.MONGODB_DATABASE || '';

    let level = process.env.LOG_CONSOLE_LEVEL || 'trace';
    if (!(level in logLevels)) {
      throw new Error('Please provide a valid console log level');
    }
    this.logger.consoleLevel = logLevels[level];
    this.logger.consoleTo =
      process.env.LOG_CONSOLE_TO === 'stderr' ? process.stderr : process.stdout;

    level = process.env.LOG_FILE_LEVEL || 'debug';
    if (!(level in logLevels)) {
      throw new Error('Please provide a valid file log level');
    }
    this.logger.consoleLevel = logLevels[level];
    this.logger.fileTo =
      process.env.LOG_FILE_TO || `storage/logs/core-${new Date()}.log`;

    this.logger.instance = new CustomLogger();
    await (this.logger.instance as any).createLogger(this.name, [
      {
        level: this.logger.consoleLevel,
        stream: this.logger.consoleTo,
      },
      {
        level: this.logger.fileLevel,
        path: this.logger.fileTo,
      },
    ]);
    DefaultLogger.use(this.logger.instance);

    return 'Success';
  }
}

const configuration = new Configuration();

export { configuration, Configuration };
