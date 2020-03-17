import { ILogger, expandObject, Logger } from '@leapjs/common';
import bunyan from 'bunyan';

class BunyanLogger implements ILogger {
  private logger!: bunyan;

  public async createLogger(
    name: string,
    streams: bunyan.Stream[],
  ): Promise<void> {
    this.logger = bunyan.createLogger({
      name,
      streams,
      serializers: bunyan.stdSerializers,
    });
  }

  public async log(message: any, context = ''): Promise<void> {
    (Logger.getInstance() as BunyanLogger).logger.info(
      `[${context}] ${message}`,
    );
  }

  public async debug(message: any, context = ''): Promise<void> {
    (Logger.getInstance() as BunyanLogger).logger.debug(
      `[${context}] ${message}`,
    );
  }

  public async warn(message: any, context = ''): Promise<void> {
    (Logger.getInstance() as BunyanLogger).logger.warn(
      `[${context}] ${message}`,
    );
  }

  public async verbose(message: any, context = ''): Promise<void> {
    (Logger.getInstance() as BunyanLogger).logger.info(
      `[${context}] ${message}`,
    );
  }

  public async error(message: any, trace: any, context = ''): Promise<void> {
    (Logger.getInstance() as BunyanLogger).logger.error(
      `[${context}] ${message} ${expandObject(trace)}`,
    );
  }
}

export default BunyanLogger;
