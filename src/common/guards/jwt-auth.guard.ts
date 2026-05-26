import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  id: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload; clientIp: string }>();
    const token = this.extractToken(req);

    try {
      req.user = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_KEY'),
      });
      req.clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        req.socket.remoteAddress ??
        '';
    } catch {
      throw new UnauthorizedException('Invalid token or expired!');
    }

    return true;
  }

  private extractToken(req: Request): string {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      throw new UnauthorizedException('Authorization header not found!');
    const parts = authHeader.split(' ');
    const bearer = parts[0];
    const token = parts[1];
    if (bearer !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid token format!');
    return token;
  }
}
