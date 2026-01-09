import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateCustomerDto {
    @Field()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @Field()
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email' })
    email: string;
}
