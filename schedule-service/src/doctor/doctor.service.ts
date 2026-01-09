import {
    Injectable,
    NotFoundException,
    Inject,
    Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorService {
    private readonly logger = new Logger(DoctorService.name);
    private readonly CACHE_TTL = 60000; // 60 seconds
    private readonly LIST_CACHE_TTL = 30000; // 30 seconds

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    private getCacheKey(id: string): string {
        return `doctor:${id}`;
    }

    private getListCacheKey(page: number, limit: number): string {
        return `doctors:page:${page}:limit:${limit}`;
    }

    async createDoctor(createDoctorDto: CreateDoctorDto) {
        const doctor = await this.prisma.doctor.create({
            data: createDoctorDto,
        });

        // Invalidate list cache
        await this.invalidateListCache();

        return doctor;
    }

    async getDoctors(page: number = 1, limit: number = 10, offset?: number) {
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
            this.prisma.doctor.findMany({
                skip: offsetNumber,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.doctor.count(),
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

    async getDoctor(id: string) {
        const cacheKey = this.getCacheKey(id);

        // Check cache first
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        // Cache the result
        await this.cacheManager.set(cacheKey, doctor, this.CACHE_TTL);

        return doctor;
    }

    async updateDoctor(id: string, updateDoctorDto: UpdateDoctorDto) {
        await this.getDoctor(id);

        const doctor = await this.prisma.doctor.update({
            where: { id },
            data: updateDoctorDto,
        });

        // Invalidate caches
        await this.cacheManager.del(this.getCacheKey(id));
        await this.invalidateListCache();

        return doctor;
    }

    async deleteDoctor(id: string) {
        await this.getDoctor(id);

        const doctor = await this.prisma.doctor.delete({
            where: { id },
        });

        // Invalidate caches
        await this.cacheManager.del(this.getCacheKey(id));
        await this.invalidateListCache();

        return doctor;
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
