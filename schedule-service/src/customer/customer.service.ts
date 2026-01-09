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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);
    private readonly CACHE_TTL = 60000; // 60 seconds
    private readonly LIST_CACHE_TTL = 30000; // 30 seconds

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    private getCacheKey(id: string): string {
        return `customer:${id}`;
    }

    private getListCacheKey(page: number, limit: number): string {
        return `customers:page:${page}:limit:${limit}`;
    }

    async createCustomer(createCustomerDto: CreateCustomerDto) {
        const existing = await this.prisma.customer.findUnique({
            where: { email: createCustomerDto.email },
        });

        if (existing) {
            throw new ConflictException('Customer already exists');
        }

        const customer = await this.prisma.customer.create({
            data: createCustomerDto,
        });

        await this.invalidateListCache();

        return customer;
    }

    async getCustomers(page: number = 1, limit: number = 10, offset?: number): Promise<{
        data: Awaited<ReturnType<typeof this.prisma.customer.findMany>>;
        total: number;
        page: number;
        limit: number;
    }> {
        const cacheKey = this.getListCacheKey(page, limit);

        const cached = await this.cacheManager.get<{
            data: Awaited<ReturnType<typeof this.prisma.customer.findMany>>;
            total: number;
            page: number;
            limit: number;
        }>(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        const offsetNumber = offset !== undefined ? offset : (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                skip: offsetNumber,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count(),
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

    async getCustomer(id: string) {
        const cacheKey = this.getCacheKey(id);

        // Check cache first
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        const customer = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // Cache the result
        await this.cacheManager.set(cacheKey, customer, this.CACHE_TTL);

        return customer;
    }

    async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto) {
        await this.getCustomer(id);

        if (updateCustomerDto.email) {
            const existing = await this.prisma.customer.findUnique({
                where: { email: updateCustomerDto.email },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('Email already used');
            }
        }

        const customer = await this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });

        // Invalidate caches
        await this.cacheManager.del(this.getCacheKey(id));
        await this.invalidateListCache();

        return customer;
    }

    async deleteCustomer(id: string) {
        await this.getCustomer(id);

        const customer = await this.prisma.customer.delete({
            where: { id },
        });

        // Invalidate caches
        await this.cacheManager.del(this.getCacheKey(id));
        await this.invalidateListCache();

        return customer;
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
