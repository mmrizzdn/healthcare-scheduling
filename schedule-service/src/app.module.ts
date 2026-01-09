import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerModule } from './customer/customer.module';
import { DoctorModule } from './doctor/doctor.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        }),
        ttl: 60000, // 60 seconds default TTL
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      formatError: (error) => {
        const originalError = error.extensions?.originalError as {
          message: string | string[];
          error?: string;
          statusCode?: number;
        };

        const message = originalError?.message
          ? Array.isArray(originalError.message)
            ? originalError.message.join(', ')
            : originalError.message
          : error.message;

        const statusCode = originalError?.statusCode || 500;

        const statusCodeMap: Record<number, string> = {
          400: 'BAD_REQUEST',
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          404: 'NOT_FOUND',
          409: 'CONFLICT',
          422: 'VALIDATION_ERROR',
          500: 'INTERNAL_SERVER_ERROR',
        };

        const code =
          (error.extensions?.code as string) !==
            'INTERNAL_SERVER_ERROR'
            ? (error.extensions?.code as string)
            : statusCodeMap[statusCode] || 'INTERNAL_SERVER_ERROR';

        return {
          message,
          path: error.path,
          extensions: {
            code,
            statusCode,
            timestamp: new Date().toISOString(),
          },
        };
      },
      context: ({ req }) => ({ req }),
    }),

    PrismaModule,
    CustomerModule,
    DoctorModule,
    ScheduleModule,
  ],
})
export class AppModule { }


