import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

describe('DoctorService', () => {
    let service: DoctorService;
    let prismaService: PrismaService;
    let cacheManager: any;

    const mockPrismaService = {
        doctor: {
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

    const mockDoctor = {
        id: 'doctor-1',
        name: 'Dr. Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DoctorService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<DoctorService>(DoctorService);
        prismaService = module.get<PrismaService>(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDoctor', () => {
        const createDto = { name: 'Dr. Smith' };

        it('should create a doctor successfully', async () => {
            mockPrismaService.doctor.create.mockResolvedValue(mockDoctor);

            const result = await service.createDoctor(createDto);

            expect(result).toEqual(mockDoctor);
            expect(mockPrismaService.doctor.create).toHaveBeenCalledWith({
                data: createDto,
            });
        });
    });

    describe('getDoctor', () => {
        it('should return cached doctor if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockDoctor);

            const result = await service.getDoctor('doctor-1');

            expect(result).toEqual(mockDoctor);
            expect(mockCacheManager.get).toHaveBeenCalledWith('doctor:doctor-1');
            expect(mockPrismaService.doctor.findUnique).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);

            const result = await service.getDoctor('doctor-1');

            expect(result).toEqual(mockDoctor);
            expect(mockPrismaService.doctor.findUnique).toHaveBeenCalledWith({
                where: { id: 'doctor-1' },
            });
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException if doctor not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.doctor.findUnique.mockResolvedValue(null);

            await expect(service.getDoctor('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getDoctors', () => {
        const mockDoctors = [mockDoctor];
        const mockResult = { data: mockDoctors, total: 1, page: 1, limit: 10 };

        it('should return cached doctors if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockResult);

            const result = await service.getDoctors(1, 10);

            expect(result).toEqual(mockResult);
            expect(mockCacheManager.get).toHaveBeenCalledWith('doctors:page:1:limit:10');
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.doctor.findMany.mockResolvedValue(mockDoctors);
            mockPrismaService.doctor.count.mockResolvedValue(1);

            const result = await service.getDoctors(1, 10) as { data: typeof mockDoctors; total: number; page: number; limit: number };

            expect(result.data).toEqual(mockDoctors);
            expect(result.total).toBe(1);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });

    describe('updateDoctor', () => {
        const updateDto = { name: 'Dr. Johnson' };

        it('should update doctor successfully', async () => {
            mockCacheManager.get.mockResolvedValue(mockDoctor);
            mockPrismaService.doctor.update.mockResolvedValue({
                ...mockDoctor,
                name: 'Dr. Johnson',
            });

            const result = await service.updateDoctor('doctor-1', updateDto);

            expect(result.name).toBe('Dr. Johnson');
            expect(mockCacheManager.del).toHaveBeenCalled();
        });
    });

    describe('deleteDoctor', () => {
        it('should delete doctor successfully', async () => {
            mockCacheManager.get.mockResolvedValue(mockDoctor);
            mockPrismaService.doctor.delete.mockResolvedValue(mockDoctor);

            const result = await service.deleteDoctor('doctor-1');

            expect(result).toEqual(mockDoctor);
            expect(mockPrismaService.doctor.delete).toHaveBeenCalledWith({
                where: { id: 'doctor-1' },
            });
            expect(mockCacheManager.del).toHaveBeenCalled();
        });
    });
});
