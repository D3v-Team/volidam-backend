import { LidStatus } from './models/lid_status.model';
import { LidStatusRole } from './models/lid_status_role.model';
import { UserRole } from '../common/enums/user-role.enum';

const SEEDS = [
  {
    name: 'YANGI',
    color: '#888780',
    order: 0,
    is_default: true,
    roles: [UserRole.OPERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
];

export async function seedLidStatuses(
  lidStatusModel: typeof LidStatus,
  lidStatusRoleModel: typeof LidStatusRole,
): Promise<void> {
  for (const item of SEEDS) {
    const [status] = await lidStatusModel.findOrCreate({
      where: { name: item.name },
      defaults: {
        name: item.name,
        color: item.color,
        order: item.order,
        is_default: item.is_default,
      },
    });

    for (const role of item.roles) {
      await lidStatusRoleModel.findOrCreate({
        where: { status_id: status.id, role },
        defaults: { status_id: status.id, role },
      });
    }
  }
  console.log('✅ Lid statuses seeded');
}
