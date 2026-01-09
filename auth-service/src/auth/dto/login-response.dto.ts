import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType()
export class LoginResponse {
    @Field(() => User)
    user: User;

    @Field()
    accessToken: string;
}
