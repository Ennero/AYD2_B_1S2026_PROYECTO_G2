import { USER_ROLE } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string; // USER_ID
  email: string;
  role: USER_ROLE;
  fullName: string;
}
