export interface MemberProfile {
  skills: string;
  workStyle: string;
  activities: string;
  competencies: string;
  preferredDirectorate: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentCoordinationId: string | null;
  joinedAt: string;
  history: AllocationHistory[];
  profile?: MemberProfile;
}

export interface Coordination {
  id: string;
  name: string;
  description: string;
  color: string;
  directorateId: string;
  maxMembers: number;
}

export interface Directorate {
  id: string;
  name: string;
  description: string;
}

export interface AllocationHistory {
  coordinationId: string;
  quarter: string; // e.g., "2024-Q1"
  startDate: string;
  endDate?: string;
}

export interface AllocationSuggestion {
  memberId: string;
  suggestedCoordinationId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Quarter {
  label: string;
  value: string;
}
