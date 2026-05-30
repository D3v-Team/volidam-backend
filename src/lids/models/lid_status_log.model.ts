import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Lid } from '../../lids/models/lid.model';
import { LidStatus } from '../../lid_statuses/models/lid_status.model';
import { User } from '../../user/models/user.model';

interface LidStatusLogAttr {
  lid_id: string;
  from_status_id: string | null;
  to_status_id: string;
  changed_by: string;
}

@Table({ tableName: 'lid_status_logs', updatedAt: false })
export class LidStatusLog extends Model<LidStatusLog, LidStatusLogAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Lid)
  @Column({ type: DataType.UUID, allowNull: false })
  declare lid_id: string;

  @BelongsTo(() => Lid, { foreignKey: 'lid_id', onDelete: 'CASCADE' })
  declare lid: Lid;

  @ForeignKey(() => LidStatus)
  @Column({ type: DataType.UUID, allowNull: true })
  declare from_status_id: string | null;

  @BelongsTo(() => LidStatus, {
    foreignKey: 'from_status_id',
    onDelete: 'SET NULL',
  })
  declare from_status: LidStatus;

  @ForeignKey(() => LidStatus)
  @Column({ type: DataType.UUID, allowNull: false })
  declare to_status_id: string;

  @BelongsTo(() => LidStatus, {
    foreignKey: 'to_status_id',
    onDelete: 'CASCADE',
  })
  declare to_status: LidStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare changed_by: string;

  @BelongsTo(() => User, { foreignKey: 'changed_by', onDelete: 'SET NULL' })
  declare changed_by_user: User;
}
