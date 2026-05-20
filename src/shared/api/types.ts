export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
};

export type MonthDayDuty = {
  section: 'A' | 'B';
  office: string;
  fullName: string;
};

export type MonthDay = {
  date: string;
  isMyDuty: boolean;
  duties: MonthDayDuty[];
  isAbsent?: boolean;
  absenceType?: string;
};

export type MonthCoverage = {
  allComplete: boolean;
  incompleteDates: string[];
};

export type MonthSchedule = {
  year: number;
  month: number;
  days: MonthDay[];
  monthCoverage?: MonthCoverage;
};

export type DaySlot = {
  section: 'A' | 'B';
  office: string;
  mandatory: boolean;
  user: { id: string; fullName: string; avatarUrl: string | null } | null;
};

export type DaySchedule = {
  date: string;
  sections: Array<{
    id: 'A' | 'B';
    label: string;
    offices: DaySlot[];
  }>;
  warnings: string[];
  myAbsence?: { type: string };
};

export type ApprovedUserForAssign = {
  id: string;
  fullName: string;
  email: string;
  isAbsent?: boolean;
  absenceType?: string;
};

export type ScheduleImportResult = {
  importedAbsences: number;
  importedDuties: number;
  changesRecorded: number;
  warnings: string[];
  unknownFio: string[];
};

export type DutyChangeType = 'assigned' | 'removed' | 'replaced';
export type DutyChangeSource = 'import' | 'manual';

export type DutyAssignmentChangeItem = {
  id: string;
  dutyDate: string;
  section: 'A' | 'B';
  office: string;
  changeType: DutyChangeType;
  source: DutyChangeSource;
  batchId: string;
  createdAt: string;
  notifiedAt: string | null;
  previousUser: { id: string; fullName: string } | null;
  newUser: { id: string; fullName: string } | null;
};

export type DutyChangesResponse = {
  changes: DutyAssignmentChangeItem[];
  nextCursor: string | null;
};
