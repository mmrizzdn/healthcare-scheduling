import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

interface ScheduleEmailData {
    customerEmail: string;
    customerName: string;
    doctorName: string;
    objective: string;
    scheduledAt: Date;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(@InjectQueue('email') private emailQueue: Queue) { }

    async sendScheduleCreatedEmail(data: ScheduleEmailData): Promise<void> {
        const job = await this.emailQueue.add('schedule-created', {
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            doctorName: data.doctorName,
            objective: data.objective,
            scheduledAt: data.scheduledAt.toISOString(),
        });
        this.logger.log(
            `Schedule created email job ${job.id} added to queue for ${data.customerEmail}`,
        );
    }

    async sendScheduleDeletedEmail(data: ScheduleEmailData): Promise<void> {
        const job = await this.emailQueue.add('schedule-deleted', {
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            doctorName: data.doctorName,
            objective: data.objective,
            scheduledAt: data.scheduledAt.toISOString(),
        });
        this.logger.log(
            `Schedule deleted email job ${job.id} added to queue for ${data.customerEmail}`,
        );
    }
}
