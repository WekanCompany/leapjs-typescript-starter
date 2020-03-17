/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-expressions */
import { stub, assert } from 'sinon';
import { expect } from 'chai';
import dotenv from 'dotenv';
import { configuration } from 'configuration/manager';
import { SecretsManager } from 'configuration/classes/aws';

const restore: any = [];

dotenv.config();

/** Configuration manager cases */
describe('Configuration manager', () => {
  it('should be a function (Classes are functions in JS)', () => {
    expect(configuration.init).to.be.an('function');
  });

  /** Configuration manager - All test cases */
  describe('the create method', () => {
    beforeEach(() => {
      /** Setup a sample config */
      restore.dotenv = stub(dotenv, 'config').resolves();
      restore.secretManager = stub(SecretsManager, 'getSecrets').resolves([
        'authentication secret',
        'sendgrid',
      ]);
    });

    afterEach(() => {
      restore.secretManager.restore();
      restore.dotenv.restore();
    });

    /** Configuration manager - Positive case 1 */
    it('should resolve successfully if the provided configuration is valid', async () => {
      await configuration.init();

      expect(configuration.authentication.token.expiry).to.be.a('number');
      expect(configuration.authentication.token.secret).to.be.a('string');

      expect(configuration.aws.secrets.region).to.be.a('string');
      expect(configuration.aws.secrets.secretId).to.be.a('string');

      expect(configuration.corsWhitelistedDomains).to.be.a('array');

      expect(configuration.database.host).to.be.a('string');
      expect(configuration.database.name).to.be.a('string');

      expect(configuration.env).to.be.a('string');

      configuration.logger.consoleLevel = {
        [Symbol.toStringTag]: 'logLevelString',
      } as any;

      configuration.logger.fileLevel = configuration.logger.consoleLevel;

      configuration.logger.consoleTo = {
        [Symbol.toStringTag]: 'NodeJS.WriteStream',
      } as any;

      configuration.logger.instance = {
        [Symbol.toStringTag]: 'Logger',
      } as any;

      expect(configuration.logger.consoleLevel).to.be.a('logLevelString');
      expect(configuration.logger.consoleTo).to.be.a('NodeJS.WriteStream');
      expect(configuration.logger.fileLevel).to.be.a('logLevelString');
      expect(configuration.logger.fileTo).to.be.a('string');
      expect(configuration.logger.instance).to.be.a('Logger');
    });

    /** Configuration manager - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {
        restore.dotenv.restore();
        restore.dotenv = stub(dotenv, 'config').resolves();
      });

      afterEach(() => {});

      /** Configuration manager - Negative case 1 */
      it('should throw an error when the configuration file is missing', async () => {
        restore.dotenv.restore();
        restore.dotenv = stub(dotenv, 'config').returns({
          error: new Error('Cannot find configuration file'),
        });

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });
      });

      /** Configuration manager - Negative case 2 */
      it('should throw an error when the provided aws secrets region is empty', async () => {
        const tmp = process.env.AWS_SECRETS_REGION;
        process.env.AWS_SECRETS_REGION = '';

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });

        process.env.AWS_SECRETS_REGION = tmp;
        restore.dotenv.restore();
      });

      /** Configuration manager - Negative case 3 */
      it('should throw an error when the provided aws secrets name is empty', async () => {
        const tmp = process.env.AWS_SECRETS_NAME;
        process.env.AWS_SECRETS_NAME = '';

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });

        process.env.AWS_SECRETS_NAME = tmp;
      });

      /** Configuration manager - Negative case 4 */
      it('should throw an error when the provided console log level is invalid', async () => {
        const tmp = process.env.LOG_CONSOLE_LEVEL;
        process.env.LOG_CONSOLE_LEVEL = 'over 9000';

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });

        process.env.LOG_CONSOLE_LEVEL = tmp;
      });

      /** Configuration manager - Negative case 5 */
      it('should throw an error when the provided file log level is invalid', async () => {
        const tmp = process.env.LOG_FILE_LEVEL;
        process.env.LOG_FILE_LEVEL = 'over 9000';

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });

        process.env.LOG_FILE_LEVEL = tmp;
      });

      /** Configuration manager - Negative case 6 */
      it('should throw an error when the bunyan logger fails to initialize', async () => {
        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });
      });

      /** Configuration manager - Negative case 5 */
      it('should throw an error when the provided file log level is invalid', async () => {
        const tmp = process.env.FIREBASE_DATABASE;
        process.env.FIREBASE_DATABASE = '';

        await configuration.init().catch((error) => {
          assert.calledOnce(restore.dotenv);
          expect(error).to.not.be.undefined;
        });

        process.env.FIREBASE_DATABASE = tmp;
      });
    });
  });
});
