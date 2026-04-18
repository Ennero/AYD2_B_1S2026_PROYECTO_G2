import { USER_ROLE } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: number; // USER_ID
  email: string;
  role: USER_ROLE;
  fullName: string;
  sessionUuid: string;
}
