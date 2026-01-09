import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleResolver } from './schedule.resolver';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('ScheduleResolver', () => {
    let resolver: ScheduleResolver;
    let scheduleService: ScheduleService;

    const mockScheduleService = {
        createSchedule: jest.fn(),
        getSchedule: jest.fn(),
        getSchedules: jest.fn(),
        deleteSchedule: jest.fn(),
    };

    const mockSchedule = {
        id: 'schedule-1',
        objective: 'Checkup',
        customerId: 'customer-1',
        doctorId: 'doctor-1',
        scheduledAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScheduleResolver,
                { provide: ScheduleService, useValue: mockScheduleService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        resolver = module.get<ScheduleResolver>(ScheduleResolver);
        scheduleService = module.get<ScheduleService>(ScheduleService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('createSchedule', () => {
        it('should create a schedule', async () => {
            mockScheduleService.createSchedule.mockResolvedValue(mockSchedule);

            const result = await resolver.createSchedule({
                objective: 'Checkup',
                customerId: 'customer-1',
                doctorId: 'doctor-1',
                scheduledAt: new Date(),
            });

            expect(result).toEqual(mockSchedule);
        });
    });

    describe('schedule', () => {
        it('should return a schedule by id', async () => {
            mockScheduleService.getSchedule.mockResolvedValue(mockSchedule);

            const result = await resolver.schedule('schedule-1');

            expect(result).toEqual(mockSchedule);
        });
    });

    describe('schedules', () => {
        it('should return schedules list', async () => {
            const mockResult = { data: [mockSchedule], total: 1, page: 1, limit: 10 };
            mockScheduleService.getSchedules.mockResolvedValue(mockResult);

            const result = await resolver.schedules(1, 10, 0);

            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteSchedule', () => {
        it('should delete a schedule', async () => {
            mockScheduleService.deleteSchedule.mockResolvedValue(mockSchedule);

            const result = await resolver.deleteSchedule('schedule-1');

            expect(result).toEqual(mockSchedule);
        });
    });
});
