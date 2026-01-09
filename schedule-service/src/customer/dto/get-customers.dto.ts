import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Customer } from '../entities/customer.entity';

@ObjectType()
export class GetCustomersDto {
    @Field(() => [Customer])
    data: Customer[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;
}
