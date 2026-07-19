import { TokenPayload } from '../modules/identity/domain/ports/token-provider.port.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: TokenPayload;
    }
  }
}

export {};
