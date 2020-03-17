import { userWithNoPasswords } from './data/user';

const mockFindOneAndUpdate = {
  exec(): any {
    return Promise.resolve(userWithNoPasswords);
  },
};

const mockFindOne = {
  select(): any {
    return this;
  },
  populate(): any {
    return this;
  },
  lean(): any {
    return this;
  },
  exec(): any {
    return Promise.resolve(userWithNoPasswords);
  },
};

const mockFindMany = {
  select(): any {
    return this;
  },
  populate(): any {
    return this;
  },
  lean(): any {
    return this;
  },
  exec(): any {
    return Promise.resolve([userWithNoPasswords, userWithNoPasswords]);
  },
};

const mockCountDocuments = {
  exec(): any {
    return Promise.resolve([userWithNoPasswords, userWithNoPasswords].length);
  },
};

const mockDeleteOne = {
  exec(): any {
    return Promise.resolve({ n: 1, ok: 1, deletedCount: 1 });
  },
};

export {
  mockFindOneAndUpdate,
  mockFindOne,
  mockFindMany,
  mockCountDocuments,
  mockDeleteOne,
};
