import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Lid } from './lid.model';
import { LidColumn } from '../../lid_columns/models/lid_column.model';

interface LidValueAttr {
  lid_id: string;
  column_id: string;
  value: string | null;
}

@Table({
  tableName: 'lid_values',
  indexes: [{ unique: true, fields: ['lid_id', 'column_id'] }],
})
export class LidValue extends Model<LidValue, LidValueAttr> {
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

  @ForeignKey(() => LidColumn)
  @Column({ type: DataType.UUID, allowNull: false })
  declare column_id: string;

  @BelongsTo(() => LidColumn, {
    foreignKey: 'column_id',
    onDelete: 'CASCADE',
  })
  declare column: LidColumn;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare value: string | null;
}
