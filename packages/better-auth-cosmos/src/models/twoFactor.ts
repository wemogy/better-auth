export interface TwoFactor {
  id: string;
  userId: string;
  secret?: string;
  backupCodes?: string;
}
