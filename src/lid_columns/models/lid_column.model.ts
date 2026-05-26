import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { LidValue } from '../../lids/models/lid_value.model';

interface LidColumnAttr {
  label: string;
  is_required?: boolean;
  order?: number;
}

@Table({ tableName: 'lid_columns' })
export class LidColumn extends Model<LidColumn, LidColumnAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare label: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_required: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare order: number;

  @HasMany(() => LidValue, { foreignKey: 'column_id', onDelete: 'CASCADE' })
  declare values: LidValue[];
}
