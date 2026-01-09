import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './dto/login-response.dto';

@Resolver(() => User)
export class AuthResolver {
    constructor(private authService: AuthService) { }

    @Mutation(() => User, {
        description: 'Register a new user with email and password',
    })
    async register(@Args('input') input: RegisterDto): Promise<User> {
        return this.authService.register(input);
    }

    @Mutation(() => LoginResponse, {
        description: 'Login an user and get an access token',
    })
    async login(@Args('input') input: LoginDto): Promise<LoginResponse> {
        return this.authService.login(input);
    }

    @Query(() => User, {
        description: 'Validate access token and return user info',
    })
    async validateToken(@Args('token') token: string): Promise<User> {
        return this.authService.validateToken(token);
    }
}
