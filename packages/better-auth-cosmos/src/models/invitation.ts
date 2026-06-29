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
