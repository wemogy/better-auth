export interface CustomAdapterConfig {
  debugLogs?: boolean;
  usePlural?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  activeOrganizationId?: string;
  activeTeamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Invitation {
  id: string;
  email: string;
  inviterId: string;
  organizationId: string;
  role: string;
  status: string;
  expiresAt: Date;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}

export interface TwoFactor {
  id: string;
  userId: string;
  secret?: string;
  backupCodes?: string;
}
