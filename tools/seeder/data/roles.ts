import { RoleStatus } from 'common/constants';

const roles = [
  {
    name: 'Administrators',
    scope: 'any',
    permissions: [
      {
        resource: '*',
        action: '*:any',
        attributes: '*',
      },
    ],
    status: RoleStatus.ACTIVE,
  },
];

export default roles;
