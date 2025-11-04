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
