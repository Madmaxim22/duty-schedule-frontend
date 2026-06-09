export type DutySlotKey = {
  section: 'A' | 'B';
  office: string;
};

export type MatrixAssignment = DutySlotKey & {
  officeLabel: string;
};

export type MatrixRow = {
  userId: string;
  fullName: string;
};

export type MatrixColumn = {
  date: string;
  dayNum: number;
  weekday: string;
  monthLabel: string;
  isIncomplete?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
};

export type MatrixCellData = {
  date: string;
  userId: string;
  assignment: MatrixAssignment | null;
  extraOffices?: string[];
};

export type DutyMatrixModel = {
  rows: MatrixRow[];
  columns: MatrixColumn[];
  cells: Map<string, MatrixCellData>;
};

export function matrixCellKey(userId: string, date: string): string {
  return `${userId}::${date}`;
}
