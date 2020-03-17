import { ValidationException, InternalServerException } from '@leapjs/common';
import { Configuration } from 'configuration/manager';
import { validate } from 'class-validator';

function parse(errors: any): any {
  if (errors.constraints !== undefined) {
    const constraints = Object.values(errors.constraints);
    const message: string = constraints[constraints.length - 1] as string;
    return new ValidationException(message);
  }
  if (errors.children !== undefined) {
    return parse(errors.children[0]);
  }
  return new InternalServerException(
    'Error object does not contain any constraints or children',
  );
}

async function isValid(configuration: Configuration): Promise<any> {
  return new Promise((resolve, reject): void => {
    validate(configuration).then((errors: any): void => {
      if (errors.length > 0) {
        reject(parse(errors[0]));
      } else {
        resolve('Success');
      }
    });
  });
}

export { parse, isValid };
