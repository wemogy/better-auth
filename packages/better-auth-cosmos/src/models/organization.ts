export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}
