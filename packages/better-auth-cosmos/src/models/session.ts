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
