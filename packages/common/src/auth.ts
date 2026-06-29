export const UserRoles = {
  owner: "owner",
  participant: "participant",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface JwtUserPayload extends AuthUser {
  iat?: number;
  exp?: number;
}
