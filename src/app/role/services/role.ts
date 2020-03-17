import { injectable } from '@leapjs/common';
import { CrudService } from '@leapjs/crud';
import { Role, RoleModel } from '../models/role';

@injectable()
class RoleService extends CrudService<Role> {
  public constructor() {
    super(RoleModel, 'name scope permissions status', {
      name: 1,
      scope: 1,
      permissions: 1,
      status: 1,
    });
  }
}

export default RoleService;
