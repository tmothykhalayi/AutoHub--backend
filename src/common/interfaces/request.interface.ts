import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../auth/enums/role.enum';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: Role;
    sub?: string;
  };
}

export interface RequestWithUser extends Request {
  user: User;
}