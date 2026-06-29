import type { AuthUser } from "@photo-prestiges/common";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
