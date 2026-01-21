import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { getQueueToken } from '@nestjs/bull';

describe('EmailService', () => {
    let service: EmailService;
    let emailQueue: any;

    const mockQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailService,
                { provide: getQueueToken('email'), useValue: mockQueue },
            ],
        }).compile();

        service = module.get<EmailService>(EmailService);
        emailQueue = mockQueue;

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendScheduleCreatedEmail', () => {
        const emailData = {
            customerEmail: 'ammar@example.com',
            customerName: 'Muhammad Ammar Izzudin',
            doctorName: 'dr. Muhammad Ammar Izzudin',
            objective: 'Sakit Gigi',
            scheduledAt: new Date('2026-01-15T10:00:00Z'),
        };

        it('should add job to email queue', async () => {
            mockQueue.add.mockResolvedValue({ id: 'job-1' });

            await service.sendScheduleCreatedEmail(emailData);

            expect(mockQueue.add).toHaveBeenCalledWith('schedule-created', {
                customerEmail: emailData.customerEmail,
                customerName: emailData.customerName,
                doctorName: emailData.doctorName,
                objective: emailData.objective,
                scheduledAt: emailData.scheduledAt.toISOString(),
            });
        });
    });

    describe('sendScheduleDeletedEmail', () => {
        const emailData = {
            customerEmail: 'ammar@example.com',
            customerName: 'Muhammad Ammar Izzudin',
            doctorName: 'dr. Muhammad Ammar Izzudin',
            objective: 'Sakit Gigi',
            scheduledAt: new Date('2026-01-15T10:00:00Z'),
        };

        it('should add job to email queue', async () => {
            mockQueue.add.mockResolvedValue({ id: 'job-2' });

            await service.sendScheduleDeletedEmail(emailData);

            expect(mockQueue.add).toHaveBeenCalledWith('schedule-deleted', {
                customerEmail: emailData.customerEmail,
                customerName: emailData.customerName,
                doctorName: emailData.doctorName,
                objective: emailData.objective,
                scheduledAt: emailData.scheduledAt.toISOString(),
            });
        });
    });
});
