import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ScheduleService', () => {
    let service: ScheduleService;
    let prismaService: PrismaService;
    let emailService: EmailService;
    let cacheManager: any;

    const mockPrismaService = {
        schedule: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        customer: {
            findUnique: jest.fn(),
        },
        doctor: {
            findUnique: jest.fn(),
        },
    };

    const mockEmailService = {
        sendScheduleCreatedEmail: jest.fn(),
        sendScheduleDeletedEmail: jest.fn(),
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockCustomer = {
        id: 'customer-1',
        name: 'Muhammad Ammar Izzudin',
        email: 'ammar@example.com',
    };

    const mockDoctor = {
        id: 'doctor-1',
        name: 'dr. Muhammad Ammar Izzudin',
    };

    const mockSchedule = {
        id: 'schedule-1',
        objective: 'Checkup',
        customerId: 'customer-1',
        doctorId: 'doctor-1',
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScheduleService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EmailService, useValue: mockEmailService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<ScheduleService>(ScheduleService);
        prismaService = module.get<PrismaService>(PrismaService);
        emailService = module.get<EmailService>(EmailService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSchedule', () => {
        const createDto = {
            objective: 'Checkup',
            customerId: 'customer-1',
            doctorId: 'doctor-1',
            scheduledAt: new Date(),
        };

        it('should create a schedule successfully', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
            mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
            mockPrismaService.schedule.findUnique.mockResolvedValue(null);
            mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

            const result = await service.createSchedule(createDto);

            expect(result).toEqual(mockSchedule);
            expect(mockEmailService.sendScheduleCreatedEmail).toHaveBeenCalled();
        });

        it('should throw NotFoundException if customer not found', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(null);

            await expect(service.createSchedule(createDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException if doctor not found', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
            mockPrismaService.doctor.findUnique.mockResolvedValue(null);

            await expect(service.createSchedule(createDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException if schedule already exists', async () => {
            mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
            mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
            mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

            await expect(service.createSchedule(createDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('getSchedule', () => {
        it('should return cached schedule if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockSchedule);

            const result = await service.getSchedule('schedule-1');

            expect(result).toEqual(mockSchedule);
            expect(mockCacheManager.get).toHaveBeenCalledWith('schedule:schedule-1');
            expect(mockPrismaService.schedule.findUnique).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

            const result = await service.getSchedule('schedule-1');

            expect(result).toEqual(mockSchedule);
            expect(mockPrismaService.schedule.findUnique).toHaveBeenCalledWith({
                where: { id: 'schedule-1' },
            });
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException if schedule not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.schedule.findUnique.mockResolvedValue(null);

            await expect(service.getSchedule('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getSchedules', () => {
        const mockSchedules = [mockSchedule];
        const mockResult = { data: mockSchedules, total: 1, page: 1, limit: 10 };

        it('should return cached schedules if available', async () => {
            mockCacheManager.get.mockResolvedValue(mockResult);

            const result = await service.getSchedules(1, 10);

            expect(result).toEqual(mockResult);
            expect(mockCacheManager.get).toHaveBeenCalledWith('schedules:page:1:limit:10');
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);
            mockPrismaService.schedule.count.mockResolvedValue(1);

            const result = await service.getSchedules(1, 10) as { data: typeof mockSchedules; total: number };

            expect(result.data).toEqual(mockSchedules);
            expect(result.total).toBe(1);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });

    describe('deleteSchedule', () => {
        const mockScheduleWithRelations = {
            ...mockSchedule,
            customer: mockCustomer,
            doctor: mockDoctor,
        };

        it('should delete schedule successfully', async () => {
            mockPrismaService.schedule.findUnique.mockResolvedValue(
                mockScheduleWithRelations,
            );
            mockPrismaService.schedule.delete.mockResolvedValue(mockSchedule);

            const result = await service.deleteSchedule('schedule-1');

            expect(result).toEqual(mockScheduleWithRelations);
            expect(mockEmailService.sendScheduleDeletedEmail).toHaveBeenCalled();
            expect(mockCacheManager.del).toHaveBeenCalled();
        });

        it('should throw NotFoundException if schedule not found', async () => {
            mockPrismaService.schedule.findUnique.mockResolvedValue(null);

            await expect(service.deleteSchedule('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
