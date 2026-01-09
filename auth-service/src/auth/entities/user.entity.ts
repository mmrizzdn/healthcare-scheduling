import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    email: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
