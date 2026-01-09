import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleService } from './schedule.service';
import { ScheduleResolver } from './schedule.resolver';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [HttpModule, EmailModule],
    providers: [ScheduleService, ScheduleResolver],
})
export class ScheduleModule { }

