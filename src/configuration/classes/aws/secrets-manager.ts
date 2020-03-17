import { InternalServerException } from '@leapjs/common';
import AWS from 'aws-sdk';

class SecretsManager {
  public region!: string;

  public secretId!: string;

  public static async getSecrets(
    region: string,
    secretId: string,
  ): Promise<boolean | [string, string]> {
    const client = new AWS.SecretsManager({
      region,
    });

    return client
      .getSecretValue({ SecretId: secretId })
      .promise()
      .then((data): [string, string] | boolean => {
        if ('SecretString' in data) {
          const secrets: any = JSON.parse(String(data.SecretString));
          return [secrets.authSecret, secrets.sendGridApiKey];
        }
        return false;
      })
      .catch((error: any) => {
        throw new InternalServerException(error.message);
      });
  }
}

export default SecretsManager;
