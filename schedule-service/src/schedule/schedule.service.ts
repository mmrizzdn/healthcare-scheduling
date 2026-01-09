import {
    Injectable,
    NotFoundException,
    ConflictException,
    Inject,
    Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ScheduleService {
    private readonly logger = new Logger(ScheduleService.name);
    private readonly CACHE_TTL = 60000; // 60 seconds
    private readonly LIST_CACHE_TTL = 30000; // 30 seconds

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    private getCacheKey(id: string): string {
        return `schedule:${id}`;
    }

    private getListCacheKey(page: number, limit: number): string {
        return `schedules:page:${page}:limit:${limit}`;
    }

    async createSchedule(createScheduleDto: CreateScheduleDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: createScheduleDto.customerId },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        const doctor = await this.prisma.doctor.findUnique({
            where: { id: createScheduleDto.doctorId },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        const existingSchedule = await this.prisma.schedule.findUnique({
            where: {
                doctorId_scheduledAt: {
                    doctorId: createScheduleDto.doctorId,
                    scheduledAt: createScheduleDto.scheduledAt,
                },
            },
        });

        if (existingSchedule) {
            throw new ConflictException('Schedule already exists');
        }

        const schedule = await this.prisma.schedule.create({
            data: createScheduleDto,
        });

        // Invalidate list cache
        await this.invalidateListCache();

        // Send email notification
        await this.emailService.sendScheduleCreatedEmail({
            customerEmail: customer.email,
            customerName: customer.name,
            doctorName: doctor.name,
            objective: schedule.objective,
            scheduledAt: schedule.scheduledAt,
        });

        return schedule;
    }

    async getSchedules(page: number = 1, limit: number = 10, offset?: number) {
        const cacheKey = this.getListCacheKey(page, limit);

        // Check cache first
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        const offsetNumber = offset !== undefined ? offset : (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.schedule.findMany({
                skip: offsetNumber,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.schedule.count(),
        ]);

        const result = {
            data,
            total,
            page,
            limit,
        };

        // Cache the result
        await this.cacheManager.set(cacheKey, result, this.LIST_CACHE_TTL);

        return result;
    }

    async getSchedule(id: string) {
        const cacheKey = this.getCacheKey(id);

        // Check cache first
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        const schedule = await this.prisma.schedule.findUnique({
            where: { id },
        });

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        // Cache the result
        await this.cacheManager.set(cacheKey, schedule, this.CACHE_TTL);

        return schedule;
    }

    async deleteSchedule(id: string) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id },
            include: {
                customer: true,
                doctor: true,
            },
        });

        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        await this.prisma.schedule.delete({
            where: { id },
        });

        // Invalidate caches
        await this.cacheManager.del(this.getCacheKey(id));
        await this.invalidateListCache();

        // Send email notification
        await this.emailService.sendScheduleDeletedEmail({
            customerEmail: schedule.customer.email,
            customerName: schedule.customer.name,
            doctorName: schedule.doctor.name,
            objective: schedule.objective,
            scheduledAt: schedule.scheduledAt,
        });

        return schedule;
    }

    private async invalidateListCache() {
        // Invalidate common list cache keys
        const patterns = [
            this.getListCacheKey(1, 10),
            this.getListCacheKey(1, 20),
            this.getListCacheKey(1, 50),
        ];
        for (const key of patterns) {
            await this.cacheManager.del(key);
        }
    }
}
