export type Role = 'fixed' | 'floating' | 'admin' | 'guest';
export type UserStatus = 'invited' | 'pending' | 'active' | 'disabled';
export type HalfDay = 'full' | 'am' | 'pm';
export type ReservationStatus = 'confirmed' | 'displaced' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plate?: string;
  role: Role;
  status: UserStatus;
  priority?: boolean;
  avatarColor: string;
  assignedPlaza?: {
    id: string;
    num: number;
    floor: string;
    bay: string;
    isShared: boolean;
    isMoto: boolean;
  } | null;
}

export interface Plaza {
  id: string;
  floor: string;
  num: number;
  bay: string;
  col?: string;
  row: number;
  isRamp: boolean;
  isService: boolean;
  isMoto: boolean;
  isShared: boolean;
  assignedUsers: { id: string; name: string; avatarColor: string }[];
  liberations?: Liberation[];
}

export interface Liberation {
  id: string;
  plazaId: string;
  userId: string;
  date: string;
  halfDay: HalfDay;
  recurrenceId?: string;
  plaza?: Plaza;
  reservation?: Reservation | null;
}

export interface Reservation {
  id: string;
  plazaId: string;
  userId: string;
  liberationId: string;
  date: string;
  halfDay: HalfDay;
  status: ReservationStatus;
  urgent: boolean;
  reason?: string;
  plaza?: Pick<Plaza, 'id' | 'num' | 'floor' | 'bay'>;
  user?: Pick<User, 'id' | 'name' | 'avatarColor'>;
}

export interface AdminRules {
  advanceBookingHours: number;
  weeklyQuotaPerUser: number;
  monthlyUrgentQuota: number;
  notifyOnLiberation: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
}
