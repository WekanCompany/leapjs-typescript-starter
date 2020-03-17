import { User } from 'app/user/models/user';

const userId = '5d665175db0b753e7c1d599c';

const passwordHash =
  '122ab7797a6868cc8621f61f8efe98823116134c3a314505e3cdb157e9a84f4900695d58897a7d150cf487ecbe74818a1ed18d39c22218291e13ea632035f3387';

const argonPasswordHash =
  '$argon2i$v=19$m=4096,t=3,p=1$EyXb6D7yCboIUeLOy1zC3Q$+S2/a3rW5n2nhRN/cfvcxEwPUT6a/jOH1B4VPzxXb9I';

const literalTestUserSuccess = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johnd@gmail.com',
  profileImageUrl: 'https://aws.ibf.com/user/default.png',
  role: [],
  status: 0,
};

const userWithNoPasswords: InstanceType<typeof User> = new User();

userWithNoPasswords.firstName = literalTestUserSuccess.firstName;
userWithNoPasswords.lastName = literalTestUserSuccess.lastName;
userWithNoPasswords.email = literalTestUserSuccess.email;
userWithNoPasswords.role = literalTestUserSuccess.role as any;
userWithNoPasswords.profileImageUrl = literalTestUserSuccess.profileImageUrl;
userWithNoPasswords.status = literalTestUserSuccess.status;

export {
  userId,
  passwordHash,
  literalTestUserSuccess,
  userWithNoPasswords,
  argonPasswordHash,
};
