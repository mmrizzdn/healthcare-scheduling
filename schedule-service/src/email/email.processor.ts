import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface ScheduleEmailData {
    customerEmail: string;
    customerName: string;
    doctorName: string;
    objective: string;
    scheduledAt: string;
}

@Processor('email')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);
    private transporter: Transporter | null = null;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        const smtpPort = this.configService.get<number>('SMTP_PORT');
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

        if (smtpHost && smtpPort) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth:
                    smtpUser && smtpPassword
                        ? {
                            user: smtpUser,
                            pass: smtpPassword,
                        }
                        : undefined,
            });
            this.logger.log('Email transporter configured');
        } else {
            this.logger.warn(
                'SMTP configuration missing. Email notifications disabled.',
            );
        }
    }

    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        }).format(date);
    }

    @Process('schedule-created')
    async handleScheduleCreated(job: Job<ScheduleEmailData>) {
        this.logger.log(`Processing schedule-created email job ${job.id}`);
        const data = job.data;

        if (!this.transporter) {
            this.logger.warn(
                `Email not sent: SMTP not configured. Would have sent to: ${data.customerEmail}`,
            );
            return;
        }

        const fromEmail =
            this.configService.get<string>('SMTP_FROM_EMAIL') ||
            'noreply@healthcare.app';

        const scheduledAtDate = new Date(data.scheduledAt);

        const mailOptions = {
            from: `"Healthcare App" <${fromEmail}>`,
            to: data.customerEmail,
            subject: 'Jadwal Anda Telah Dibuat - Healthcare App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Jadwal Berhasil Dibuat</h2>
                    <p>Halo <strong>${data.customerName}</strong>,</p>
                    <p>Jadwal Anda telah berhasil dibuat dengan detail sebagai berikut:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Tanggal</td>
                                <td style="padding: 8px 0; font-weight: bold;">${this.formatDate(scheduledAtDate)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Dokter</td>
                                <td style="padding: 8px 0; font-weight: bold;">${data.doctorName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Keperluan</td>
                                <td style="padding: 8px 0; font-weight: bold;">${data.objective}</td>
                            </tr>
                        </table>
                    </div>
                    <p>Terima kasih telah menggunakan layanan kami.</p>
                    <p style="color: #6b7280; margin-top: 30px;">Salam,<br/>Healthcare App Team</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Schedule created email sent to ${data.customerEmail}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send schedule created email to ${data.customerEmail}`,
                error,
            );
            throw error; // Re-throw to trigger Bull retry
        }
    }

    @Process('schedule-deleted')
    async handleScheduleDeleted(job: Job<ScheduleEmailData>) {
        this.logger.log(`Processing schedule-deleted email job ${job.id}`);
        const data = job.data;

        if (!this.transporter) {
            this.logger.warn(
                `Email not sent: SMTP not configured. Would have sent to: ${data.customerEmail}`,
            );
            return;
        }

        const fromEmail =
            this.configService.get<string>('SMTP_FROM_EMAIL') ||
            'noreply@healthcare.app';

        const scheduledAtDate = new Date(data.scheduledAt);

        const mailOptions = {
            from: `"Healthcare App" <${fromEmail}>`,
            to: data.customerEmail,
            subject: 'Jadwal Anda Telah Dibatalkan - Healthcare App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Jadwal Telah Dibatalkan</h2>
                    <p>Halo <strong>${data.customerName}</strong>,</p>
                    <p>Jadwal Anda telah dibatalkan:</p>
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Tanggal</td>
                                <td style="padding: 8px 0; font-weight: bold;">${this.formatDate(scheduledAtDate)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Dokter</td>
                                <td style="padding: 8px 0; font-weight: bold;">${data.doctorName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;">Keperluan</td>
                                <td style="padding: 8px 0; font-weight: bold;">${data.objective}</td>
                            </tr>
                        </table>
                    </div>
                    <p>Jika ini bukan permintaan Anda, silakan hubungi kami segera.</p>
                    <p style="color: #6b7280; margin-top: 30px;">Salam,<br/>Healthcare App Team</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Schedule deleted email sent to ${data.customerEmail}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send schedule deleted email to ${data.customerEmail}`,
                error,
            );
            throw error;
        }
    }
}
