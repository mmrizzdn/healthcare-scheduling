import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DoctorService } from './doctor.service';
import { DoctorResolver } from './doctor.resolver';

@Module({
    imports: [HttpModule],
    providers: [DoctorService, DoctorResolver],
})
export class DoctorModule {}
