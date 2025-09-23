import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private userApi: string;

  constructor(private readonly configService: ConfigService) {
    this.userApi = this.configService.get<string>('USER_API')!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token is missing.');
    }

    try {
      // ✅ Tell axios what type of data we expect
      const response = await axios.post<ValidateTokenResponse>(
        `${this.userApi}/users/validate-token`,
        { token }
      );

      if (response.data.valid) {
        request.userId = response.data.userId; // Attach userId if available
        return true;
      } else {
        throw new UnauthorizedException('Invalid token.');
      }
    } catch (error) {
      throw new UnauthorizedException('Token validation failed.');
    }
  }
}