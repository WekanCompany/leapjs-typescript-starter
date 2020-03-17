import { ValidateNested } from 'class-validator';
import Token from './token';

class Authentication {
  @ValidateNested()
  public token!: Token;
}

export { Authentication, Token };
