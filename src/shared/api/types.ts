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

export type MonthDay = {
  date: string;
  isMyDuty: boolean;
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
};
