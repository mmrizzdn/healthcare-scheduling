import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';

@InputType()
export class LoginDto {
    @Field()
    @IsNotEmpty({ message: 'Invalid email or password' })
    @IsEmail({}, { message: 'Invalid email or password' })
    email: string;

    @Field(() => String)
    @IsNotEmpty({ message: 'Invalid email or password' })
    @MinLength(8, { message: 'Invalid email or password' })
    @MaxLength(128, { message: 'Invalid email or password' })
    password: string;
}
