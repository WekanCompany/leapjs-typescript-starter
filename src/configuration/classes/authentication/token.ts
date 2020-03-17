import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

const INVALID_AUTH_EXPIRY_TIME =
  'Please provide a valid expiry time in minutes for the auth token';

class Token {
  @IsNotEmpty({ message: 'Please provide a secret key to sign auth tokens' })
  public secret!: string;

  @IsNotEmpty({ message: 'Please provide an expiry time for the auth token' })
  @IsInt({ message: INVALID_AUTH_EXPIRY_TIME })
  @Min(1, { message: INVALID_AUTH_EXPIRY_TIME })
  @Max(60, { message: INVALID_AUTH_EXPIRY_TIME })
  public expiry!: number;
}

export default Token;
