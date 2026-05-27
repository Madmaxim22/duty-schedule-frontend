export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
};

export type PublicUserProfile = {
  id: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
};

export type MonthDayDuty = {
  section: 'A' | 'B';
  office: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
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
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentPhotoId: string | null;
    avatarFocusX: number;
    avatarFocusY: number;
  } | null;
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

export type AbsenceStatsByType = {
  type: string;
  count: number;
  dates: string[];
};

export type AdminStatisticsUser = {
  id: string;
  fullName: string;
  duties: { month: number; year: number };
  absences: {
    month: number;
    year: number;
    monthByType: AbsenceStatsByType[];
    yearByType: AbsenceStatsByType[];
  };
};

export type AdminStatisticsResponse = {
  year: number;
  month: number;
  users: AdminStatisticsUser[];
};

export type PhotoLikeStatus = {
  likeCount: number;
  likedByMe: boolean;
  canLike: boolean;
};

export type UserPhoto = {
  id: string;
  url: string;
  isCurrent: boolean;
  focusX: number;
  focusY: number;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
};

export type UpdatePhotoFocusResponse = {
  photo: UserPhoto;
  user: User;
};

export type UserPhotosResponse = {
  photos: UserPhoto[];
  count: number;
  maxPhotos: number;
};

export type UploadPhotoResponse = {
  photo: UserPhoto;
  user: User;
};

/** @deprecated Use PhotoLikeStatus */
export type AvatarLikeStatus = PhotoLikeStatus;

export type NotificationType =
  | 'photo_like'
  | 'duty_change'
  | 'user_registration'
  | 'support_message'
  | 'chat_message';

export type NotificationPayload = {
  dutyDate?: string;
  section?: 'A' | 'B';
  office?: string;
  changeType?: DutyChangeType;
  source?: DutyChangeSource;
  photoId?: string;
  userId?: string;
  threadId?: string;
  roomId?: string;
};

export type ChatRoomType = 'direct' | 'group';

export type ChatContact = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
};

export type ChatRoomListItem = {
  id: string;
  type: ChatRoomType;
  title: string | null;
  displayName: string;
  displayAvatarUrl: string | null;
  displayAvatarFocusX: number;
  displayAvatarFocusY: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
};

export type ChatMessageAuthor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
  role: UserRole;
};

export type ChatReactionReactor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
};

export type ChatReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  reactors: ChatReactionReactor[];
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  reactions: ChatReactionSummary[];
  status?: 'sent' | 'delivered' | 'read';
  author: ChatMessageAuthor;
};

export type ChatRoomMember = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
  role?: UserRole;
  lastReadAt?: string | null;
};

export type ChatRoomDetail = {
  id: string;
  type: ChatRoomType;
  title: string | null;
  displayName: string;
  displayAvatarUrl: string | null;
  displayAvatarFocusX: number;
  displayAvatarFocusY: number;
  createdAt: string;
  updatedAt: string;
  members: ChatRoomMember[];
};

export type SupportThreadStatus = 'open' | 'closed';

export type SupportThreadSummary = {
  id: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    avatarFocusX: number;
    avatarFocusY: number;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
};

export type SupportMessageAuthor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentPhotoId: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
  role: UserRole;
};

export type SupportMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: SupportMessageAuthor;
};

export type SupportThreadDetail = {
  id: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  author: SupportMessageAuthor;
};

export type SupportThreadsResponse = {
  threads: SupportThreadSummary[];
};

export type SupportThreadResponse = {
  thread: SupportThreadDetail;
  messages: SupportMessage[];
};

export type CreateSupportThreadResponse = {
  thread: Omit<SupportThreadDetail, 'author'> & {
    author: { id: string; fullName: string; avatarUrl: string | null };
  };
  messages: SupportMessage[];
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  body: string;
  readAt: string | null;
  createdAt: string;
  payload: NotificationPayload | null;
  actor: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    avatarFocusX: number;
    avatarFocusY: number;
  } | null;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  nextCursor: string | null;
};
