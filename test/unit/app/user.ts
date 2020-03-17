/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-empty-function */
import { assert, stub, spy } from 'sinon';
import { expect } from 'chai';
import { UserModel, User } from 'app/user/models/user';
import service from 'app/user/services/user';
import argon2 from 'argon2';
import * as messaging from 'common/services/messaging';
import {
  literalTestUserSuccess,
  userWithNoPasswords,
  passwordHash,
  userId,
} from 'test/helpers/data/user';
import {
  mockFindOneAndUpdate,
  mockFindOne,
  mockCountDocuments,
  mockDeleteOne,
  mockFindMany,
} from 'test/helpers/database';
import { Container } from '@leapjs/core';
import RoleService from 'app/role/services/role';
import { UserStatus } from 'common/constants';

const stubs: any = [];
const spies: any = [];

const UserService = new Container().resolve<service>(service);

/** User test cases */
describe('User service', () => {
  it('should be a function (Classes are functions in JS)', () => {
    expect(service).to.be.an('function');
  });

  it('should have a method create', () => {
    expect(typeof UserService.createOne).to.equal('function');
  });

  it('should have a method updateOne', () => {
    expect(typeof UserService.updateOne).to.equal('function');
  });

  it('should have a method getOne', () => {
    expect(typeof UserService.getOne).to.equal('function');
  });

  it('should have a method getMany', () => {
    expect(typeof UserService.getMany).to.equal('function');
  });

  it('should have a method deleteOne', () => {
    expect(typeof UserService.deleteOne).to.equal('function');
  });

  /** User create one - All test cases */
  describe('the create method', () => {
    const user = Object.create(userWithNoPasswords);

    beforeEach(() => {
      user.password = passwordHash;
      user.verificationCode = '1234';
      stubs.user = UserModel.prototype;
      UserModel.prototype.save = (): {} => {
        return user;
      };
      stubs.sendMail = stub(messaging, 'sendVerificationMail').callsFake(
        async () => {},
      );
      stubs.getOne = stub(RoleService.prototype, 'getOne').resolves(user);
    });

    afterEach(() => {
      stubs.getOne.restore();
      stubs.sendMail.restore();
      UserModel.prototype.save = stubs.user;
    });

    it("should return object containing the unverified created user's information (Verification mail sent)", async () => {
      await UserService.createOne(user);
      assert.calledOnce(stubs.getOne);
      assert.calledOnce(stubs.sendMail);
    });

    it("should return object containing the verified created user's information (No verification mail sent)", async () => {
      UserModel.prototype.save = (): {} => {
        literalTestUserSuccess.status = UserStatus.VERIFIED;
        return literalTestUserSuccess;
      };
      user.status = UserStatus.VERIFIED;
      await UserService.createOne(user);
      assert.calledOnce(stubs.getOne);
      assert.callCount(stubs.sendMail, 0);
      user.status = UserStatus.NOT_VERIFIED;
    });

    /** User create one - Negative cases */
    describe('error cases', () => {
      let save!: any;

      beforeEach(() => {
        save = UserModel.prototype;
        UserModel.prototype.save = (): any => {
          return new Promise((resolve, reject) => {
            return reject(new Error('failed'));
          });
        };
      });
      afterEach(() => {
        UserModel.prototype.save = save;
      });
      it("should throw an error when the save database call fails to create the user's information", async () => {
        await UserService.createOne(user).catch((error) => {
          assert.calledOnce(stubs.getOne);
          expect(error).to.not.be.undefined;
        });
      });
      it('should throw an internal server error when the save database call fails due to server side issues (Network, Database connection down / timeouts)', async () => {
        UserModel.prototype.save = (): boolean => {
          return false;
        };
        await UserService.createOne(user).catch((error): void => {
          assert.calledOnce(stubs.getOne);
          // eslint-disable-next-line no-param-reassign
          error = { [Symbol.toStringTag]: 'InternalServerError' };
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('InternalServerError');
        });
      });
      it('should throw an error when argon2 hash fails to hash the password', async () => {
        stubs.hash = stub(argon2, 'hash').rejects(new Error(''));
        await UserService.createOne(user).catch((error) => {
          expect(error).to.not.be.undefined;
        });
        stubs.hash.restore();
      });
    });
  });

  /** User update one - All test cases */
  describe('the update one method', () => {
    const user = new User();
    before(() => {
      user.firstName = 'Jane';
      user.lastName = 'Doe';
      user.password = passwordHash;
    });

    beforeEach(() => {
      stubs.updateOne = stub(UserModel, 'findOneAndUpdate').returns(
        mockFindOneAndUpdate as any,
      );
      spies.hash = spy(argon2, 'hash');
    });

    afterEach(() => {
      spies.hash.restore();
      stubs.updateOne.restore();
    });

    after(() => {});

    it("should return object containing the updated user's information (with user password)", async () => {
      const success = await UserService.updateOne({ _id: userId }, user);
      assert.calledOnce(stubs.updateOne.withArgs({ _id: userId }, user));
      expect(success).to.be.equal(userWithNoPasswords);
    });

    it("should return object containing the updated user's information (without user password)", async () => {
      delete user.password;
      const success = await UserService.updateOne({ _id: userId }, user);
      assert.calledOnce(stubs.updateOne.withArgs({ _id: userId }, user));
      const tmp = userWithNoPasswords;
      delete tmp.password;
      expect(success).to.be.equal(userWithNoPasswords);
    });

    describe('error cases', () => {
      beforeEach(() => {
        spies.hash.restore();
        stubs.updateOne.restore();
        stubs.updateOne = stub(UserModel, 'findOneAndUpdate').returns(
          mockFindOneAndUpdate as any,
        );
        spies.hash = spy(argon2, 'hash');
      });

      afterEach(() => {});

      it('should throw an error when the update database call fails', async () => {
        const tmp: any = mockFindOneAndUpdate;
        tmp.exec = (): any => {
          return new Promise((resolve, reject) => {
            return reject(new Error('failed'));
          });
        };
        stubs.updateOne.restore();
        stubs.updateOne = stub(UserModel, 'findOneAndUpdate').returns(tmp);
        delete user.password;
        await UserService.updateOne({ _id: userId }, user).catch((error) => {
          expect(error).to.not.be.undefined;
        });
        user.password = passwordHash;
      });
      it('should throw an error when the update database call fails due to server side issues (Network, Database connection down / timeouts)', async () => {
        const tmp: any = mockFindOneAndUpdate;
        tmp.exec = (): any => {
          return new Promise((resolve) => {
            return resolve(false);
          });
        };
        stubs.updateOne.restore();
        stubs.updateOne = stub(UserModel, 'findOneAndUpdate').returns(tmp);
        delete user.password;
        await UserService.updateOne({ _id: userId }, user).catch((error) => {
          assert.calledOnce(stubs.updateOne.withArgs({ _id: userId }, user));
          // eslint-disable-next-line no-param-reassign
          error = { [Symbol.toStringTag]: 'InternalServerError' };
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('InternalServerError');
        });
        user.password = passwordHash;
      });
      it('should throw an error when the provided email address already exists', async () => {
        const tmp: any = mockFindOneAndUpdate;
        tmp.exec = (): any => {
          return false;
        };
        stubs.updateOne.restore();
        stubs.updateOne = stub(UserModel, 'findOneAndUpdate').returns(tmp);
        delete user.password;
        await UserService.updateOne({ _id: userId }, user).catch((error) => {
          assert.calledOnce(stubs.updateOne.withArgs({ _id: userId }, user));
          // eslint-disable-next-line no-param-reassign
          error = { [Symbol.toStringTag]: 'NotFoundError' };
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('NotFoundError');
        });
        user.password = passwordHash;
      });
      it('should throw an error when argon2 hash fails to hash the password', async () => {
        spies.hash.restore();
        stubs.hash = stub(argon2, 'hash').rejects(new Error(''));
        user.password = passwordHash;
        await UserService.updateOne({ _id: userId }, user).catch((error) => {
          assert.callCount(stubs.updateOne.withArgs({ _id: userId }, user), 0);
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('error');
        });
        stubs.hash.restore();
      });
    });
  });

  /** User get one - All test cases */
  describe('the get one method', () => {
    before(() => {
      stubs.getOne = stub(UserModel, 'findOne').returns(mockFindOne as any);
    });

    after(() => {
      stubs.getOne.restore();
    });

    /** User get one - Positive case 1 */
    it("should return object containing the requested user's information", async () => {
      const success = await UserService.getOne({ _id: userId });

      assert.calledOnce(stubs.getOne.withArgs({ _id: userId }));
      /** TODO: better result check */
      expect(success).to.include.keys(
        'firstName',
        'lastName',
        'email',
        'profileImageUrl',
        'status',
      );
    });

    /** User get one - Positive case 2 */
    it("should return object with the requested fields containing the requested user's information", async () => {
      stubs.getOne.restore();
      mockFindOne.exec = (): any => {
        return Promise.resolve({
          firstName: userWithNoPasswords.firstName,
          lastName: userWithNoPasswords.lastName,
          email: userWithNoPasswords.email,
          role: userWithNoPasswords.role,
        });
      };
      stubs.getOne = stub(UserModel, 'findOne').returns(mockFindOne as any);
      const fields = 'firstName, lastName, email, role'.replace(/,/g, ' ');

      const success = await UserService.getOne({ _id: userId }, fields);

      assert.calledOnce(stubs.getOne.withArgs({ _id: userId }));
      expect(success).to.have.all.keys(
        'firstName',
        'lastName',
        'email',
        'role',
      );

      stubs.getOne.restore();
    });

    /** User get one - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {
        stubs.getOne.restore();

        mockFindOne.exec = (): any => {
          return Promise.resolve(null);
        };

        stubs.getOne = stub(UserModel, 'findOne').returns(mockFindOne as any);
      });

      afterEach(() => {});

      /** User get one - Negative case 1 */
      it("should return object containing the requested user's information", async () => {
        await UserService.getOne({ _id: userId }).catch((error) => {
          assert.calledOnce(stubs.getOne.withArgs({ _id: userId }));
          // eslint-disable-next-line no-param-reassign
          error = {
            [Symbol.toStringTag]: 'InternalServerError',
          };
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('InternalServerError');
        });
      });
    });
  });

  /** User get many - All test cases */
  describe('the get many method', () => {
    before(() => {
      stubs.getMany = stub(UserModel, 'find').returns(mockFindMany as any);
      stubs.countDocuments = stub(UserModel, 'countDocuments').returns(
        mockCountDocuments as any,
      );
    });

    after(() => {
      stubs.countDocuments.restore();
      stubs.getMany.restore();
    });

    /** User get many - Positive case 1 */
    it('should return array of objects containing information on all the users', async () => {
      const success = await UserService.getMany(['id', 'asc']);

      assert.calledOnce(stubs.getMany.withArgs({}));
      assert.calledOnce(stubs.countDocuments.withArgs({}));

      for (let i = 0; i < success[0].length; i += 1) {
        expect(success[0][i].firstName).to.not.be.undefined;
        expect(success[0][i].lastName).to.not.be.undefined;
        expect(success[0][i].email).to.not.be.undefined;
        expect(success[0][i].profileImageUrl).to.not.be.undefined;
        expect(success[0][i].status).to.not.be.undefined;
      }
      expect(success[1]).to.not.be.undefined;
      expect(success[1]).to.be.a('number');
    });

    /** User get many - Negative test cases */
    describe('error cases', () => {
      beforeEach(() => {
        stubs.countDocuments.restore();
        stubs.getMany.restore();

        mockFindMany.exec = (): any => {
          return Promise.reject(new Error(''));
        };
        mockCountDocuments.exec = (): any => {
          return Promise.reject(new Error(''));
        };
        stubs.getMany = stub(UserModel, 'find').returns(mockFindMany as any);
        stubs.countDocuments = stub(UserModel, 'countDocuments').returns(
          mockCountDocuments as any,
        );
      });

      afterEach(() => {});

      /** User get many - Negative case 1 */
      it('should return array of objects containing information on all the users', async () => {
        await UserService.getMany(['id', 'asc']).catch((error) => {
          assert.calledOnce(stubs.getMany.withArgs({}));
          assert.callCount(stubs.countDocuments.withArgs({}), 0);
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('error');
        });
      });

      /** User get many - Negative case 2 */
      it('should return array of objects with the requested fields containing information on all the users', async () => {
        stubs.getMany.restore();
        stubs.countDocuments.restore();

        mockFindMany.exec = (): any => {
          return Promise.resolve([
            {
              firstName: userWithNoPasswords.firstName,
              lastName: userWithNoPasswords.lastName,
              email: userWithNoPasswords.email,
            },
          ]);
        };
        stubs.getMany = stub(UserModel, 'find').returns(mockFindMany as any);
        mockCountDocuments.exec = (): any => {
          return Promise.resolve(1);
        };
        stubs.countDocuments = stub(UserModel, 'countDocuments').returns(
          mockCountDocuments as any,
        );

        const fields = 'firstName, lastName, email'.replace(/,/g, ' ');

        const success = await UserService.getMany(['id', 'asc'], {}, fields);

        assert.calledOnce(stubs.getMany.withArgs({}, fields));

        for (let i = 0; i < success[0].length; i += 1) {
          expect(success[0][i].firstName).to.not.be.undefined;
          expect(success[0][i].lastName).to.not.be.undefined;
          expect(success[0][i].email).to.not.be.undefined;
        }
        expect(success[1]).to.not.be.undefined;
        expect(success[1]).to.be.a('number');

        stubs.countDocuments.restore();
        stubs.getMany.restore();
      });
    });
  });

  /** User delete one - All test cases */
  describe('the delete one method', () => {
    before(() => {
      stubs.deleteOne = stub(UserModel, 'deleteOne').returns(
        mockDeleteOne as any,
      );
    });

    after(() => {
      stubs.deleteOne.restore();
    });

    /** User delete one - Positive case 1 */
    it('should return object containing status of a successful delete operation', async () => {
      const success = await UserService.deleteOne(userId);

      assert.calledOnce(stubs.deleteOne.withArgs({ _id: userId }));
      expect(success).to.be.deep.equal({ n: 1, ok: 1, deletedCount: 1 });
    });

    /** User delete one - Negative test cases */
    describe('error cases', () => {
      before(() => {
        stubs.deleteOne.restore();
      });

      afterEach(() => {
        stubs.deleteOne.restore();
      });

      /** User delete one - Negative case 1 */
      it('should throw an error when the delete one database call fails', async () => {
        mockDeleteOne.exec = (): Promise<never> => {
          return Promise.reject(new Error(''));
        };
        stubs.deleteOne = stub(UserModel, 'deleteOne').returns(
          mockDeleteOne as any,
        );
        await UserService.deleteOne(userId).catch((error) => {
          assert.calledOnce(stubs.deleteOne.withArgs({ _id: userId }));
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('error');
        });
      });

      /** User delete one - Negative case 2 */
      it('should return object containing status of a unsuccessful delete operation', async () => {
        mockDeleteOne.exec = (): Promise<{}> => {
          return Promise.resolve({ n: 1, ok: 0, deletedCount: 0 });
        };
        stubs.deleteOne = stub(UserModel, 'deleteOne').returns(
          mockDeleteOne as any,
        );
        await UserService.deleteOne(userId).catch((error) => {
          assert.calledOnce(stubs.deleteOne.withArgs({ _id: userId }));
          // eslint-disable-next-line no-param-reassign
          error = { [Symbol.toStringTag]: 'InternalServerError' };
          expect(error).to.not.be.undefined;
          expect(error).to.be.an('InternalServerError');
        });
      });
    });
  });
});
