import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetCustomersDto } from './dto/get-customers.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Resolver()
@UseGuards(AuthGuard)
export class CustomerResolver {
    constructor(private readonly customerService: CustomerService) { }

    @Mutation(() => Customer, {
        description: 'Create a new customer with name and email. Requires authentication.',
    })
    createCustomer(@Args('input') createCustomerDto: CreateCustomerDto) {
        return this.customerService.createCustomer(createCustomerDto);
    }

    @Query(() => GetCustomersDto, {
        description: 'Get paginated list of customers. Supports page, limit, and offset parameters.',
    })
    customers(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Page number (starts from 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 10, description: 'Number of items per page' }) limit: number,
        @Args('offset', { type: () => Int, defaultValue: 0, description: 'Number of items to skip' }) offset: number,
    ) {
        return this.customerService.getCustomers(page, limit, offset);
    }

    @Query(() => Customer, {
        name: 'customer',
        description: 'Get a single customer by ID',
    })
    customer(@Args('id', { description: 'Customer UUID' }) id: string) {
        return this.customerService.getCustomer(id);
    }

    @Mutation(() => Customer, {
        description: 'Update an existing customer. Partial updates are supported.',
    })
    updateCustomer(
        @Args('id', { description: 'Customer UUID to update' }) id: string,
        @Args('input') updateCustomerDto: UpdateCustomerDto,
    ) {
        return this.customerService.updateCustomer(id, updateCustomerDto);
    }

    @Mutation(() => Customer, {
        description: 'Delete a customer by ID. Returns the deleted customer data.',
    })
    deleteCustomer(@Args('id', { description: 'Customer UUID to delete' }) id: string) {
        return this.customerService.deleteCustomer(id);
    }
}

