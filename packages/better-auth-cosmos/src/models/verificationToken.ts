export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
