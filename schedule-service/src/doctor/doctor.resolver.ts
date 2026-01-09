import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { GetDoctorsDto } from './dto/get-doctors.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Resolver()
@UseGuards(AuthGuard)
export class DoctorResolver {
    constructor(private readonly doctorService: DoctorService) { }

    @Mutation(() => Doctor, {
        description: 'Register a new doctor in the system. Requires authentication.',
    })
    createDoctor(@Args('input') createDoctorDto: CreateDoctorDto) {
        return this.doctorService.createDoctor(createDoctorDto);
    }

    @Query(() => GetDoctorsDto, {
        description: 'Get paginated list of doctors. Supports page, limit, and offset parameters.',
    })
    doctors(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Page number (starts from 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 10, description: 'Number of items per page' }) limit: number,
        @Args('offset', { type: () => Int, defaultValue: 0, description: 'Number of items to skip' }) offset: number,
    ) {
        return this.doctorService.getDoctors(page, limit, offset);
    }

    @Query(() => Doctor, {
        name: 'doctor',
        description: 'Get a single doctor by ID',
    })
    doctor(@Args('id', { description: 'Doctor UUID' }) id: string) {
        return this.doctorService.getDoctor(id);
    }

    @Mutation(() => Doctor, {
        description: 'Update doctor information by ID',
    })
    updateDoctor(
        @Args('id', { description: 'Doctor UUID to update' }) id: string,
        @Args('input') updateDoctorDto: UpdateDoctorDto,
    ) {
        return this.doctorService.updateDoctor(id, updateDoctorDto);
    }

    @Mutation(() => Doctor, {
        description: 'Remove a doctor from the system. Returns the deleted doctor data.',
    })
    deleteDoctor(@Args('id', { description: 'Doctor UUID to delete' }) id: string) {
        return this.doctorService.deleteDoctor(id);
    }
}

