import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { LidStatus } from './lid_status.model';
import { UserRole } from '../../common/enums/user-role.enum';

interface LidStatusRoleAttr {
  status_id: string;
  role: UserRole;
}

@Table({
  tableName: 'lid_status_roles',
  indexes: [{ unique: true, fields: ['status_id', 'role'] }],
})
export class LidStatusRole extends Model<LidStatusRole, LidStatusRoleAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => LidStatus)
  @Column({ type: DataType.UUID, allowNull: false })
  declare status_id: string;

  @BelongsTo(() => LidStatus, { foreignKey: 'status_id', onDelete: 'CASCADE' })
  declare status: LidStatus;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  declare role: UserRole;
}
