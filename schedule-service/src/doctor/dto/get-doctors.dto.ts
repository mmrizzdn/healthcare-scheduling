import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Doctor } from '../entities/doctor.entity';

@ObjectType()
export class GetDoctorsDto {
    @Field(() => [Doctor])
    data: Doctor[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;
}
