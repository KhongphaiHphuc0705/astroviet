export type Role = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: Role;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}
