import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional } from 'class-validator';

@InputType()
export class UpdateCustomerDto {
    @Field(() => String, { nullable: true })
    @IsOptional()
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email' })
    email?: string;
}
