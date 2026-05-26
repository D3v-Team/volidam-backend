import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../../user/models/user.model';
import { LidStatus } from '../../lid_statuses/models/lid_status.model';
import { LidValue } from './lid_value.model';

interface LidAttr {
  fio: string;
  telefon_raqam: string;
  status_id?: string;
  created_by: string;
}

@Table({ tableName: 'lids' })
export class Lid extends Model<Lid, LidAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fio: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  declare telefon_raqam: string;

  @ForeignKey(() => LidStatus)
  @Column({ type: DataType.UUID, allowNull: true })
  declare status_id: string;

  @BelongsTo(() => LidStatus, {
    foreignKey: 'status_id',
    onDelete: 'SET NULL',
  })
  declare status: LidStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string;

  @BelongsTo(() => User, { foreignKey: 'created_by', onDelete: 'SET NULL' })
  declare creator: User;

  @HasMany(() => LidValue, { foreignKey: 'lid_id', onDelete: 'CASCADE' })
  declare values: LidValue[];
}
