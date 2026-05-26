import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { LidStatusRole } from './lid_status_role.model';
import { Lid } from '../../lids/models/lid.model';

interface LidStatusAttr {
  name: string;
  color?: string;
  order?: number;
  is_default?: boolean;
}

@Table({ tableName: 'lid_statuses' })
export class LidStatus extends Model<LidStatus, LidStatusAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: '#888780',
  })
  declare color: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare order: number;

  // Yangi lid yaratilganda shu status beriladi
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_default: boolean;

  @HasMany(() => LidStatusRole, {
    foreignKey: 'status_id',
    onDelete: 'CASCADE',
  })
  declare roles: LidStatusRole[];

  @HasMany(() => Lid, { foreignKey: 'status_id' })
  declare lids: Lid[];
}
