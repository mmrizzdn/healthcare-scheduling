import {
    Injectable,
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto): Promise<User> {
        const { email, password } = registerDto;

        const existing = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        return user;
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new BadRequestException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user,
        };
    }

    async validateToken(token: string): Promise<User> {
        try {
            const payload = this.jwtService.verify(token);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
