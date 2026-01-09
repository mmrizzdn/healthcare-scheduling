import { InputType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class UpdateDoctorDto {
    @Field(() => String)
    @IsOptional()
    name: string;
}
