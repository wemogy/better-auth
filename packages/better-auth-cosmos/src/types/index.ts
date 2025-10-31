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
