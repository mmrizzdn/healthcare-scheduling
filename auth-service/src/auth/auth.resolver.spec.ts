import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

describe('AuthResolver', () => {
    let resolver: AuthResolver;
    let authService: AuthService;

    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
        validateToken: jest.fn(),
    };

    const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthResolver,
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        resolver = module.get<AuthResolver>(AuthResolver);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('register', () => {
        const registerInput = {
            email: 'newuser@example.com',
            password: 'password123',
            confirmPassword: 'password123',
        };

        it('should call authService.register with input', async () => {
            mockAuthService.register.mockResolvedValue(mockUser);

            const result = await resolver.register(registerInput);

            expect(result).toEqual(mockUser);
            expect(mockAuthService.register).toHaveBeenCalledWith(registerInput);
        });
    });

    describe('login', () => {
        const loginInput = {
            email: 'test@example.com',
            password: 'password123',
        };

        const loginResponse = {
            accessToken: 'jwt-token-123',
            user: mockUser,
        };

        it('should call authService.login with input', async () => {
            mockAuthService.login.mockResolvedValue(loginResponse);

            const result = await resolver.login(loginInput);

            expect(result).toEqual(loginResponse);
            expect(mockAuthService.login).toHaveBeenCalledWith(loginInput);
        });
    });

    describe('validateToken', () => {
        const token = 'valid-jwt-token';

        it('should call authService.validateToken with token', async () => {
            mockAuthService.validateToken.mockResolvedValue(mockUser);

            const result = await resolver.validateToken(token);

            expect(result).toEqual(mockUser);
            expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
        });
    });
});
