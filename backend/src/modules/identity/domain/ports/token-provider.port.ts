export interface TokenPayload {
  sub: string; // userId
  role: 'user' | 'admin';
}

export interface ITokenProvider {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date };
  verifyAccessToken(token: string): TokenPayload;
}
