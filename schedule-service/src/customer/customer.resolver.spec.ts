import { Test, TestingModule } from '@nestjs/testing';
import { CustomerResolver } from './customer.resolver';
import { CustomerService } from './customer.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('CustomerResolver', () => {
    let resolver: CustomerResolver;
    let customerService: CustomerService;

    const mockCustomerService = {
        createCustomer: jest.fn(),
        getCustomer: jest.fn(),
        getCustomers: jest.fn(),
        updateCustomer: jest.fn(),
        deleteCustomer: jest.fn(),
    };

    const mockCustomer = {
        id: 'customer-1',
        name: 'Muhammad Ammar Izzudin',
        email: 'ammar@example.com',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomerResolver,
                { provide: CustomerService, useValue: mockCustomerService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        resolver = module.get<CustomerResolver>(CustomerResolver);
        customerService = module.get<CustomerService>(CustomerService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('createCustomer', () => {
        it('should create a customer', async () => {
            mockCustomerService.createCustomer.mockResolvedValue(mockCustomer);

            const result = await resolver.createCustomer({
                name: 'Muhammad Ammar Izzudin',
                email: 'ammar@example.com',
            });

            expect(result).toEqual(mockCustomer);
            expect(mockCustomerService.createCustomer).toHaveBeenCalled();
        });
    });

    describe('customer', () => {
        it('should return a customer by id', async () => {
            mockCustomerService.getCustomer.mockResolvedValue(mockCustomer);

            const result = await resolver.customer('customer-1');

            expect(result).toEqual(mockCustomer);
        });
    });

    describe('customers', () => {
        it('should return customers list', async () => {
            const mockResult = { data: [mockCustomer], total: 1, page: 1, limit: 10 };
            mockCustomerService.getCustomers.mockResolvedValue(mockResult);

            const result = await resolver.customers(1, 10, 0);

            expect(result).toEqual(mockResult);
        });
    });

    describe('updateCustomer', () => {
        it('should update a customer', async () => {
            mockCustomerService.updateCustomer.mockResolvedValue({
                ...mockCustomer,
                name: 'Ewok',
            });

            const result = await resolver.updateCustomer('customer-1', {
                name: 'Ewok',
            });

            expect(result.name).toBe('Ewok');
        });
    });

    describe('deleteCustomer', () => {
        it('should delete a customer', async () => {
            mockCustomerService.deleteCustomer.mockResolvedValue(mockCustomer);

            const result = await resolver.deleteCustomer('customer-1');

            expect(result).toEqual(mockCustomer);
        });
    });
});
