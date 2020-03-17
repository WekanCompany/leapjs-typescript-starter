import { RoleStatus } from 'common/constants';
import { Role } from 'app/role/models/role';

const adminRole: InstanceType<typeof Role> = new Role();

adminRole.name = 'Administrators';
adminRole.permissions = [
  {
    resource: '*',
    action: '*:any',
    attributes: '*',
  },
];
adminRole.status = RoleStatus.ACTIVE;

export default adminRole;
