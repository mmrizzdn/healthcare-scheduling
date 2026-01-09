import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Authorization header not found');
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            throw new UnauthorizedException('Invalid token');
        }

        try {
            const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
            const response = await firstValueFrom(
                this.httpService.post(authServiceUrl, {
                    query: `
                        query ValidateToken($token: String!) {
                            validateToken(token: $token) {
                                id
                                email
                            }
                        }
                    `,
                    variables: { token },
                }),
            );

            if (response.data.errors) {
                throw new UnauthorizedException('Invalid token');
            }

            request.user = response.data.data.validateToken;

            return true;
        } catch (error) {
            throw new UnauthorizedException('Failed to validate token');
        }
    }
}
