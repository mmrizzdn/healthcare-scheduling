import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Schedule } from '../entities/schedule.entity';

@ObjectType()
export class GetSchedulesDto {
    @Field(() => [Schedule])
    data: Schedule[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;
}
