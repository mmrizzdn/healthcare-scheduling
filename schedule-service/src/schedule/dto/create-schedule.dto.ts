import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail } from 'class-validator';

@InputType()
export class CreateScheduleDto {
    @Field()
    @IsNotEmpty({ message: 'Objective is required' })
    objective: string;

    @Field()
    @IsNotEmpty({ message: 'Customer ID is required' })
    customerId: string;

    @Field()
    @IsNotEmpty({ message: 'Doctor ID is required' })
    doctorId: string;

    @Field()
    @IsNotEmpty({ message: 'Scheduled at is required' })
    scheduledAt: Date;
}
