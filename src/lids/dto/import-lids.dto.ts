export class ImportResultDto {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; fio: string; reason: string }[];
}
