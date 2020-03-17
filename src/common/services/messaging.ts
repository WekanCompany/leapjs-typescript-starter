import { IMailOptions } from '@leapjs/messaging';
import { configuration } from 'configuration/manager';

async function sendVerificationMail(data: any): Promise<void> {
  const mail = configuration.mailer.getInstance();
  if (!mail) {
    throw new Error('Error mailer not initiazlied');
  }
  const message: IMailOptions = {
    to: data[0],
    from: configuration.mailer.fromEmail || '',
    subject: `Welcome to ${data[3]}`,
    text: `Your OTP for verification ${data[1]}`,
    engine: 'ejs',
    template: './src/resources/templates/email/verification.ejs',
    templateData: {
      name: data[2],
      // eslint-disable-next-line @typescript-eslint/camelcase
      product_name: data[3],
      // eslint-disable-next-line @typescript-eslint/camelcase
      verification_code: data[1],
    },
    html: '',
  };
  mail.queue(message);
}

async function sendResetPasswordMail(data: any): Promise<void> {
  const mail = configuration.mailer.getInstance();
  if (!mail) {
    throw new Error('Error mailer not initiazlied');
  }
  const message: IMailOptions = {
    to: data[0],
    from: configuration.mailer.fromEmail || '',
    subject: 'Password reset',
    text: `Your temporary password ${data[1]}`,
    engine: 'ejs',
    template: './src/resources/templates/email/reset-password.ejs',
    // eslint-disable-next-line @typescript-eslint/camelcase
    templateData: { name: data[2], temp_code: data[1] },
    html: '',
  };
  mail.queue(message);
}

export { sendVerificationMail, sendResetPasswordMail };
