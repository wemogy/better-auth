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
