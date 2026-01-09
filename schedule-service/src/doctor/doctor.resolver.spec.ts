import { Test, TestingModule } from '@nestjs/testing';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('DoctorResolver', () => {
    let resolver: DoctorResolver;
    let doctorService: DoctorService;

    const mockDoctorService = {
        createDoctor: jest.fn(),
        getDoctor: jest.fn(),
        getDoctors: jest.fn(),
        updateDoctor: jest.fn(),
        deleteDoctor: jest.fn(),
    };

    const mockDoctor = {
        id: 'doctor-1',
        name: 'Dr. Smith',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DoctorResolver,
                { provide: DoctorService, useValue: mockDoctorService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        resolver = module.get<DoctorResolver>(DoctorResolver);
        doctorService = module.get<DoctorService>(DoctorService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('createDoctor', () => {
        it('should create a doctor', async () => {
            mockDoctorService.createDoctor.mockResolvedValue(mockDoctor);

            const result = await resolver.createDoctor({ name: 'Dr. Smith' });

            expect(result).toEqual(mockDoctor);
        });
    });

    describe('doctor', () => {
        it('should return a doctor by id', async () => {
            mockDoctorService.getDoctor.mockResolvedValue(mockDoctor);

            const result = await resolver.doctor('doctor-1');

            expect(result).toEqual(mockDoctor);
        });
    });

    describe('doctors', () => {
        it('should return doctors list', async () => {
            const mockResult = { data: [mockDoctor], total: 1, page: 1, limit: 10 };
            mockDoctorService.getDoctors.mockResolvedValue(mockResult);

            const result = await resolver.doctors(1, 10, 0);

            expect(result).toEqual(mockResult);
        });
    });

    describe('updateDoctor', () => {
        it('should update a doctor', async () => {
            mockDoctorService.updateDoctor.mockResolvedValue({
                ...mockDoctor,
                name: 'Dr. Johnson',
            });

            const result = await resolver.updateDoctor('doctor-1', {
                name: 'Dr. Johnson',
            });

            expect(result.name).toBe('Dr. Johnson');
        });
    });

    describe('deleteDoctor', () => {
        it('should delete a doctor', async () => {
            mockDoctorService.deleteDoctor.mockResolvedValue(mockDoctor);

            const result = await resolver.deleteDoctor('doctor-1');

            expect(result).toEqual(mockDoctor);
        });
    });
});
