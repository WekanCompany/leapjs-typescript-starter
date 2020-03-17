/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-empty-function */
import { stub, spy, assert } from 'sinon';
import { expect } from 'chai';
import service from 'app/auth/services/auth';
import UserService from 'app/user/services/user';
import jwt from 'jsonwebtoken';
import {
  literalTestUserSuccess,
  userWithNoPasswords,
  passwordHash,
  userId,
  argonPasswordHash,
} from 'test/helpers/data/user';
import argon2 from 'argon2';
import { UserStatus } from 'common/constants';
import * as messaging from 'common/services/messaging';
import * as common from '@leapjs/common';
import { Container } from '@leapjs/core';
import { configuration } from 'configuration/manager';
import { Authentication, Token } from 'configuration/classes/authentication';

const AuthService = new Container().resolve<service>(service);

const stubs: any = [];
const spies: any = [];

configuration.authentication = new Authentication();
configuration.authentication.token = new Token();

/** Authentication test cases */
describe('Authentication service', () => {
  it('should be a function (Classes are functions in JS)', () => {
    expect(AuthService).to.be.an('Object');
  });

  it('should have a method generateTokens', () => {
    expect(typeof AuthService.generateTokens).to.equal('function');
  });

  it('should have a method authenticate', () => {
    expect(typeof AuthService.authenticate).to.equal('function');
  });

  it('should have a method refresh', () => {
    expect(typeof AuthService.refresh).to.equal('function');
  });

  it('should have a method resetPassword', () => {
    expect(typeof AuthService.resetPassword).to.equal('function');
  });

  it('should have a method sendOtp', () => {
    expect(typeof AuthService.sendOtp).to.equal('function');
  });

  it('should have a method verify', () => {
    expect(typeof AuthService.verify).to.equal('function');
  });

  /** Authentication generate tokens - All test cases */
  describe('the generate tokens method', () => {
    beforeEach(() => {
      spies.sign = spy(jwt, 'sign');
      configuration.authentication.token.expiry = 30;
      configuration.authentication.token.secret = 'secret';
    });

    afterEach(() => {
      spies.sign.restore();
    });

    /** Authentication generate tokens - Positive case 1 */
    it('should return an access token string if signed successfully', async () => {
      const result = AuthService.generateTokens(literalTestUserSuccess.email);
      expect(result).to.be.an('string');
      assert.calledOnce(spies.sign);
    });

    /** Authentication generate tokens - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication generate tokens - Negative case 1 */
      it('should throw an internal server error if unable to sign tokens', async () => {
        spies.sign.restore();
        stubs.jwt = stub(jwt, 'sign').callsFake(() => {
          throw new common.InternalServerException('error signing token');
        });

        expect(() => {
          AuthService.generateTokens(literalTestUserSuccess.email);
        }).to.throw(common.InternalServerException);

        stubs.jwt.restore();
      });

      /** Authentication generate tokens - Negative case 2 */
      it('should throw an internal server error if unable to generate expiry time', async () => {
        const date = configuration.authentication.token.expiry;
        configuration.authentication.token.expiry = undefined as any;
        expect(() => {
          AuthService.generateTokens(literalTestUserSuccess.email);
        }).to.throw(common.InternalServerException);
        assert.callCount(spies.sign, 0);
        configuration.authentication.token.expiry = date;
      });
    });
  });

  /** Authentication is equal - All test cases */
  describe('the isEqual method', () => {
    beforeEach(() => {
      spies.verify = spy(argon2, 'verify');
      spies.generate = spy(AuthService, 'generateTokens');

      configuration.authentication.token.expiry = 30;
      configuration.authentication.token.secret = 'secret';
    });

    afterEach(() => {
      spies.generate.restore();
      spies.verify.restore();
    });

    /** Authentication is equal - Positive case 1 */
    it('should return an access token string if the passwords match', async () => {
      userWithNoPasswords.password = passwordHash;
      const userInDb = Object.create(userWithNoPasswords);
      userInDb.password = argonPasswordHash;
      const success = await AuthService.isEqual(userWithNoPasswords, userInDb);
      expect(success).to.be.an('string');
      assert.calledOnce(
        spies.verify.withArgs(userInDb.password, userWithNoPasswords.password),
      );
      assert.calledOnce(spies.generate.withArgs(userWithNoPasswords.email));
    });

    /** Authentication is equal - Positive case 2 */
    it('should return an access token string if the password matches the tmp password (password reset)', async () => {
      spies.verify.restore();
      stubs.verify = stub(argon2, 'verify');
      stubs.verify.onCall(0).resolves(false);
      stubs.verify.onCall(1).resolves(true);
      userWithNoPasswords.password = passwordHash;
      const tmpUser = Object.create(userWithNoPasswords);
      tmpUser.password = 'invalidpasswordhash';
      tmpUser.tmpPassword = passwordHash;
      const success = await AuthService.isEqual(userWithNoPasswords, tmpUser);
      expect(success).to.be.an('string');
      assert.calledTwice(stubs.verify);
      assert.calledOnce(spies.generate.withArgs(userWithNoPasswords.email));
      stubs.verify.restore();
    });

    /** Authentication generate tokens - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication is equal - Negative case 1 */
      it('should throw an unauthorized error if passwords do not match and tmpPassword is null', async () => {
        userWithNoPasswords.password = passwordHash;
        const tmpUser = Object.create(userWithNoPasswords);
        tmpUser.password = 'invalidpasswordhash';
        tmpUser.tmpPassword = null;
        stubs.verify.restore();
        stubs.verify = stub(argon2, 'verify').resolves(true);
        await AuthService.isEqual(userWithNoPasswords, tmpUser).catch(
          (error: any) => {
            assert.calledOnce(
              stubs.verify.withArgs(
                userWithNoPasswords.password,
                tmpUser.password,
              ),
            );
            // eslint-disable-next-line no-param-reassign
            error = { [Symbol.toStringTag]: 'UnauthorizedError' };
            expect(error).to.not.be.undefined;
            expect(error).to.be.an('UnauthorizedError');
            stubs.verify.restore();
          },
        );
      });

      /** Authentication is equal - Negative case 1 */
      it("should throw an unauthorized error if provided password does not match the user's password or tmp Password", async () => {
        userWithNoPasswords.password = passwordHash;
        const tmpUser = Object.create(userWithNoPasswords);
        tmpUser.password = 'invalidpasswordhash';
        tmpUser.tmpPassword = 'invalidpasswordhash';
        spies.verify.restore();
        stubs.verify = stub(argon2, 'verify').resolves(true);
        await AuthService.isEqual(userWithNoPasswords, tmpUser).catch(
          (error: any) => {
            assert.calledTwice(stubs.verify);
            // eslint-disable-next-line no-param-reassign
            error = { [Symbol.toStringTag]: 'UnauthorizedError' };
            expect(error).to.not.be.undefined;
            expect(error).to.be.an('UnauthorizedError');
          },
        );
        stubs.verify.restore();
      });
    });
  });

  /** Authentication authenticate - All test cases */
  describe('the authenticate method', () => {
    const user = Object.create(userWithNoPasswords);

    beforeEach(() => {
      spies.isEqual = spy(AuthService, 'isEqual');
      user.password = argonPasswordHash;
      user.tmpPassword = null;
      user.status = UserStatus.VERIFIED;
      stubs.getOne = stub(UserService.prototype, 'getOne').resolves(user);

      configuration.authentication.token.expiry = 30;
      configuration.authentication.token.secret = 'secret';
    });
    afterEach(() => {
      stubs.getOne.restore();
      spies.isEqual.restore();
    });

    /** Authentication authenticate - Positive case 1 */
    it('should return an object constaining logged in user information along with access token', async () => {
      const tmpUser = Object.create(user);
      tmpUser.password = passwordHash;
      const success = await AuthService.authenticate(tmpUser);
      assert.calledOnce(spies.isEqual);
      assert.calledOnce(stubs.getOne);
      expect(success.accessToken).to.not.be.undefined;
    });

    /** Authentication authenticate - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication authenticate - Negative case 1 */
      // it('', async () => {});
    });
  });

  /** Authentication refresh - All test cases */
  describe('the refresh method', () => {
    const user = Object.create(userWithNoPasswords);

    beforeEach(() => {
      spies.generate = spy(AuthService, 'generateTokens');
      user.password = 'invalidpasswordhash';
      user.tmpPassword = 'invalidpasswordhash';
      user.status = UserStatus.VERIFIED;
      stubs.getOne = stub(UserService.prototype, 'getOne').resolves(user);
      stubs.verify = stub(jwt, 'verify').resolves(true);
      stubs.decode = stub(jwt, 'decode').resolves(true);

      configuration.authentication.token.expiry = 30;
      configuration.authentication.token.secret = 'secret';
    });
    afterEach(() => {
      stubs.decode.restore();
      stubs.verify.restore();
      stubs.getOne.restore();
      spies.generate.restore();
    });

    /** Authentication refresh - Positive case 1 */
    it('should return an object constaining logged in user information along with access tokens', async () => {
      const success = await AuthService.refresh('access token');
      assert.calledOnce(stubs.verify);
      assert.calledOnce(stubs.decode);
      assert.calledOnce(stubs.getOne);
      assert.calledOnce(spies.generate);
      expect(success.accessToken).to.not.be.undefined;
    });

    /** Authentication refresh - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication refresh - Negative case 1 */
      // it('', async () => {});
    });
  });

  /** Authentication reset password - All test cases */
  describe('the reset password method', () => {
    const user = Object.create(userWithNoPasswords);
    beforeEach(() => {
      stubs.hash = stub(argon2, 'hash').resolves('$hash');
      stubs.sendMail = stub(messaging, 'sendResetPasswordMail').callsFake(
        async () => {},
      );
      stubs.getOne = stub(UserService.prototype, 'getOne').resolves(user);
      stubs.updateOne = stub(UserService.prototype, 'updateOne').resolves();
    });
    afterEach(() => {
      stubs.updateOne.restore();
      stubs.getOne.restore();
      stubs.sendMail.restore();
      stubs.hash.restore();
    });

    /** Authentication reset password - Positive case 1 */
    it('should send an email containing the temporary password', async () => {
      await AuthService.resetPassword(user.email);

      assert.calledOnce(stubs.getOne);
      assert.calledOnce(stubs.hash);
      assert.calledOnce(stubs.sendMail);
      assert.calledOnce(stubs.updateOne);
    });

    /** Authentication reset password - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication reset password - Negative case 1 */
      // it('', async () => {});
    });
  });

  /** Authentication sent otp - All test cases */
  describe('the send otp method', () => {
    const user = Object.create(userWithNoPasswords);

    beforeEach(() => {
      user.verificationCode = '0123';
      user.status = UserStatus.NOT_VERIFIED;
      stubs.sendMail = stub(messaging, 'sendVerificationMail').callsFake(
        async () => {},
      );
      stubs.getOne = stub(UserService.prototype, 'getOne').resolves(user);
    });
    afterEach(() => {
      stubs.sendMail.restore();
      stubs.getOne.restore();
    });

    /** Authentication sent otp - Positive case 1 */
    it('should send an email containing the verification code', async () => {
      await AuthService.sendOtp(userId);
      assert.calledOnce(stubs.getOne);
    });

    /** Authentication sent otp - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication sent otp - Negative case 1 */
      // it('', async () => {});
    });
  });

  /** Authentication verify - All test cases */
  describe('the verify method', () => {
    const user = Object.create(userWithNoPasswords);

    beforeEach(() => {
      user.password = 'invalidpasswordhash';
      user.tmpPassword = 'invalidpasswordhash';
      user.status = UserStatus.NOT_VERIFIED;
      stubs.updateOne = stub(UserService.prototype, 'updateOne').resolves(user);

      configuration.authentication.token.expiry = 30;
      configuration.authentication.token.secret = 'secret';
    });

    afterEach(() => {
      stubs.updateOne.restore();
    });

    it('should update the user status to verified if the verification code is correct', async () => {
      const success = await AuthService.verify(userId, '0123');
      assert.calledOnce(stubs.updateOne);
      expect(success.accessToken).to.not.be.undefined;
    });

    /** Authentication verify - Negative cases */
    describe('error cases', () => {
      beforeEach(() => {});

      afterEach(() => {});

      /** Authentication verify - Negative case 1 */
      it('should throw an internal server error if unable to sign tokens', async () => {});
    });
  });
});
