import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
    ConflictException,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'password123',
            confirmPassword: 'password123',
        };

        it('should register a new user successfully', async () => {
            const hashedPassword = 'hashedPassword123';
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            mockPrismaService.user.create.mockResolvedValue({
                ...mockUser,
                email: registerDto.email,
            });

            const result = await service.register(registerDto);

            expect(result.email).toBe(registerDto.email);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
            expect(mockPrismaService.user.create).toHaveBeenCalledWith({
                data: {
                    email: registerDto.email,
                    password: hashedPassword,
                },
            });
        });

        it('should throw ConflictException if user already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(mockPrismaService.user.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should login successfully and return access token', async () => {
            const accessToken = 'jwt-token-123';
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue(accessToken);

            const result = await service.login(loginDto);

            expect(result.accessToken).toBe(accessToken);
            expect(result.user).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginDto.email },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(
                loginDto.password,
                mockUser.password,
            );
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
        });

        it('should throw BadRequestException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                BadRequestException,
            );
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginDto.email },
            });
        });

        it('should throw BadRequestException if password is invalid', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(
                BadRequestException,
            );
            expect(bcrypt.compare).toHaveBeenCalledWith(
                loginDto.password,
                mockUser.password,
            );
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });
    });

    describe('validateToken', () => {
        const validToken = 'valid-jwt-token';

        it('should validate token and return user', async () => {
            const payload = { sub: mockUser.id, email: mockUser.email };
            mockJwtService.verify.mockReturnValue(payload);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.validateToken(validToken);

            expect(result).toEqual(mockUser);
            expect(mockJwtService.verify).toHaveBeenCalledWith(validToken);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: payload.sub },
            });
        });

        it('should throw UnauthorizedException if token is invalid', async () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(service.validateToken('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const payload = { sub: 'non-existent-id', email: 'test@example.com' };
            mockJwtService.verify.mockReturnValue(payload);
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.validateToken(validToken)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
