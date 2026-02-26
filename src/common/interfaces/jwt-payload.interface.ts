import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  role: Role;
}
