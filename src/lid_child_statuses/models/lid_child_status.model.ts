import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { LidStatus } from '../../lid_statuses/models/lid_status.model';
import { Lid } from '../../lids/models/lid.model';
export enum Type {
  TOQ = 'toq',
  JUFT = 'juft',
}

export interface LidChildStatusAttr {
  id?: string;
  status_id: string;
  name: string;
  order?: number;
  color?: string;
  type: Type;
}

@Table({
  tableName: 'lid_child_statuses',
  timestamps: true,
  underscored: true,
})
export class LidChildStatus extends Model<LidChildStatus, LidChildStatusAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => LidStatus)
  @Column({ type: DataType.UUID, allowNull: false })
  declare status_id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: '#888780',
  })
  declare color?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  declare order?: number;

  @Column({
    type: DataType.ENUM(...Object.values(Type)),
    allowNull: false,
  })
  declare type: Type;

  @HasMany(() => Lid, { foreignKey: 'child_status_id' })
  declare lids: Lid[];
}
