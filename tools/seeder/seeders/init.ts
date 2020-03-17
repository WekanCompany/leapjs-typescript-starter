import { RoleModel } from 'app/role/models/role';
import { Validator } from 'class-validator';

async function seeder(seeders: any[]): Promise<boolean> {
  const count = await RoleModel.countDocuments().exec();
  if (count > 0) {
    return Promise.reject(
      new Error('Database is not empty. Seeding cancelled'),
    );
  }

  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  const validator = new Validator();

  if (
    defaultEmail === undefined ||
    defaultEmail === '' ||
    !validator.isEmail(defaultEmail)
  ) {
    return Promise.reject(
      new Error('Please provide a valid email for the default administrator'),
    );
  }
  if (defaultPassword === undefined || defaultPassword === '') {
    return Promise.reject(
      new Error(
        'Please provide a sha512 hashed password for the default administrator',
      ),
    );
  }

  for (let i = 0; i < seeders.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await seeders[i]();
  }

  return true;
}

export default seeder;
