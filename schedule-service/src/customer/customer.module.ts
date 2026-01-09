import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerService } from './customer.service';
import { CustomerResolver } from './customer.resolver';

@Module({
    imports: [HttpModule],
    providers: [CustomerService, CustomerResolver],
})
export class CustomerModule {}
