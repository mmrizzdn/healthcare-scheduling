import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { GetSchedulesDto } from './dto/get-schedules.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Resolver()
@UseGuards(AuthGuard)
export class ScheduleResolver {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Mutation(() => Schedule, {
        description: 'Create a new appointment schedule between a customer and a doctor. Sends confirmation email automatically.',
    })
    createSchedule(@Args('input') createScheduleDto: CreateScheduleDto) {
        return this.scheduleService.createSchedule(createScheduleDto);
    }

    @Query(() => GetSchedulesDto, {
        description: 'Get paginated list of all schedules/appointments. Supports page, limit, and offset parameters.',
    })
    schedules(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Page number (starts from 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 10, description: 'Number of items per page' }) limit: number,
        @Args('offset', { type: () => Int, defaultValue: 0, description: 'Number of items to skip' }) offset: number,
    ) {
        return this.scheduleService.getSchedules(page, limit, offset);
    }

    @Query(() => Schedule, {
        name: 'schedule',
        description: 'Get a single schedule/appointment by ID with customer and doctor details',
    })
    schedule(@Args('id', { description: 'Schedule UUID' }) id: string) {
        return this.scheduleService.getSchedule(id);
    }

    @Mutation(() => Schedule, {
        description: 'Cancel/delete an appointment. Sends cancellation email to the customer automatically.',
    })
    deleteSchedule(@Args('id', { description: 'Schedule UUID to delete' }) id: string) {
        return this.scheduleService.deleteSchedule(id);
    }
}

