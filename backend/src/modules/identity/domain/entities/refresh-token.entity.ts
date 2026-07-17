export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdByIp: string | null;
}
