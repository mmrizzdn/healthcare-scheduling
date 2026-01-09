import { InputType, Field } from '@nestjs/graphql';
import {
    IsNotEmpty,
    IsEmail,
    MinLength,
    MaxLength,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'Match', async: false })
class MatchConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];

        return value === relatedValue;
    }

    defaultMessage(args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;

        return `${args.property} must match ${relatedPropertyName}`;
    }
}

@InputType()
export class RegisterDto {
    @Field()
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email' })
    email: string;

    @Field(() => String)
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password must be at most 128 characters long' })
    password: string;

    @Field(() => String)
    @Validate(MatchConstraint, ['password'], {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}
