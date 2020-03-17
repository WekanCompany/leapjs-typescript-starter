import { Middleware } from '@leapjs/router';
import {
  HttpException,
  BadRequestException,
  HttpStatus,
  Logger,
  inject,
} from '@leapjs/common';

@Middleware()
class ErrorHandler {
  @inject(Logger) private readonly logger!: Logger;

  // eslint-disable-next-line consistent-return
  public after(err: any, req: any, res: any, next: (error?: any) => any): void {
    let error = err;

    if (error === undefined) {
      return next();
    }

    if (error.statusCode !== undefined && error.message !== undefined) {
      error = new HttpException(error.statusCode, error.message);
    }

    if (error.httpCode !== undefined && error.name === 'ParamRequiredError') {
      error = new BadRequestException('Invalid parameters provided');
    }

    if (error.errors !== undefined && Object.keys(error.errors).length) {
      this.logger.error(error.errors, error.stack, 'ErrorHandler');
      res.status(error.status).send({ errors: { messages: error.errors } });
    } else {
      this.logger.error(error.message, error.stack, 'ErrorHandler');
      res
        .status(error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ errors: { messages: [error.message] } });
    }
  }
}

export default ErrorHandler;
