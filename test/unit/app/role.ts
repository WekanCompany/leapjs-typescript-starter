/* eslint-disable @typescript-eslint/no-empty-function */
import { stub, assert } from 'sinon';
import service from 'app/role/services/role';
import { Container } from '@leapjs/core';
import { Model } from 'mongoose';
import roles from 'test/helpers/data/roles';
import { expect } from 'chai';

const stubs: any = [];

const RoleService = new Container().resolve<service>(service);

/** class/module/feature test suites */
describe('', () => {
  /** All test cases for method 1 */
  describe('the create method', () => {
    beforeEach(() => {
      stubs.role = stub(Model.prototype, 'save').resolves(roles);
    });
    afterEach(() => {
      stubs.role.restore();
    });
    it("should return object containing the created role's information", async () => {
      const result: any = await RoleService.createOne(roles);
      assert.calledOnce(stubs.role);
      expect(result.name).to.be.eq('Administrators');
    });
    describe('error cases', () => {
      beforeEach(() => {});
      afterEach(() => {});
    });
  });
});
