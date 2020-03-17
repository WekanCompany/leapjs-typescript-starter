import { plainToClass } from 'class-transformer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Validator as ModelValidator } from 'class-validator';
import { ValidationException, InternalServerException } from '@leapjs/common';

class Validator {
  public static parse(errors: any): any {
    if (errors.constraints !== undefined) {
      return new ValidationException(
        'Validation Error',
        Object.values(errors.constraints).reverse(),
      );
    }
    if (errors.children !== undefined) {
      return Validator.parse(errors.children[0]);
    }
    return new InternalServerException(
      'Error object does not contain any constraints or children',
    );
  }

  public static validate(classType: any, groups?: string[]): RequestHandler {
    const validator = new ModelValidator();
    return (req: Request, res: Response, next: NextFunction): void => {
      const input: any = plainToClass(classType, req.body);
      validator
        .validate(input, {
          groups,
          skipMissingProperties: true,
          validationException: { target: false },
        })
        .then((errors: any): any => {
          if (errors.length > 0) {
            return next(Validator.parse(errors[0]));
          }
          req.body = input;
          return next();
        });
    };
  }
}

export default Validator;
