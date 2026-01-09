import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateDoctorDto {
    @Field()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;
}
