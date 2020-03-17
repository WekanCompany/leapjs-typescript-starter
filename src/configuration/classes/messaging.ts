import { IsDefined, IsNotEmpty, IsEmail } from 'class-validator';
import { Mail } from '@leapjs/messaging';

class Messaging {
  @IsDefined({ message: 'Please provide an API key for the mailer' })
  @IsNotEmpty({ message: 'Please provide a valid API key for the mailer' })
  public apiKey!: string;

  @IsDefined({ message: 'Please provide a "from" email address' })
  @IsEmail({}, { message: 'Please provide a valid "from" email address' })
  public fromEmail!: string;

  public queue = 'mailer';

  private instance?: Mail;

  public setInstance(instance: Mail): void {
    this.instance = instance;
  }

  public getInstance(): Mail | undefined {
    return this.instance;
  }
}

export default Messaging;
