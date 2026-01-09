import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CustomerService', () => {
    let service: CustomerService;
    let prismaService: PrismaService;
    let cacheManager: any;

    const mockPrismaService = {
        customer: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockCustomer = {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomerService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<CustomerService>(CustomerService);
        prismaService = module.get<PrismaService>(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createCustomer', () => {
        const createDto = { name: 'John Doe', email: 'john@example.com' };

        it('should create a customer successfully', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(null);
            mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

            const result = await service.createCustomer(createDto);

            expect(result).toEqual(mockCustomer);
            expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
                where: { email: createDto.email },
            });
            expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
                data: createDto,
            });
        });

        it('should throw ConflictException if customer already exists', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

            await expect(service.createCustomer(createDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('getCustomer', () => {
        it('should return cached customer if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockCustomer);

            const result = await service.getCustomer('customer-1');

            expect(result).toEqual(mockCustomer);
            expect(mockCacheManager.get).toHaveBeenCalledWith('customer:customer-1');
            expect(mockPrismaService.customer.findUnique).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

            const result = await service.getCustomer('customer-1');

            expect(result).toEqual(mockCustomer);
            expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
                where: { id: 'customer-1' },
            });
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException if customer not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.customer.findUnique.mockResolvedValue(null);

            await expect(service.getCustomer('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getCustomers', () => {
        const mockCustomers = [mockCustomer];
        const mockResult = { data: mockCustomers, total: 1, page: 1, limit: 10 };

        it('should return cached customers if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockResult);

            const result = await service.getCustomers(1, 10);

            expect(result).toEqual(mockResult);
            expect(mockCacheManager.get).toHaveBeenCalledWith('customers:page:1:limit:10');
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);
            mockPrismaService.customer.count.mockResolvedValue(1);

            const result = await service.getCustomers(1, 10);

            expect(result.data).toEqual(mockCustomers);
            expect(result.total).toBe(1);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });

    describe('updateCustomer', () => {
        const updateDto = { name: 'Jane Doe' };

        it('should update customer successfully', async () => {
            mockCacheManager.get.mockResolvedValue(mockCustomer);
            mockPrismaService.customer.update.mockResolvedValue({
                ...mockCustomer,
                name: 'Jane Doe',
            });

            const result = await service.updateCustomer('customer-1', updateDto);

            expect(result.name).toBe('Jane Doe');
            expect(mockCacheManager.del).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already used', async () => {
            mockCacheManager.get.mockResolvedValue(mockCustomer);
            mockPrismaService.customer.findUnique.mockResolvedValue({
                ...mockCustomer,
                id: 'other-customer',
            });

            await expect(
                service.updateCustomer('customer-1', { email: 'other@example.com' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('deleteCustomer', () => {
        it('should delete customer successfully', async () => {
            mockCacheManager.get.mockResolvedValue(mockCustomer);
            mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

            const result = await service.deleteCustomer('customer-1');

            expect(result).toEqual(mockCustomer);
            expect(mockPrismaService.customer.delete).toHaveBeenCalledWith({
                where: { id: 'customer-1' },
            });
            expect(mockCacheManager.del).toHaveBeenCalled();
        });
    });
});
