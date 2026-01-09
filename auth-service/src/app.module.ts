import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
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
        AuthModule,
    ],
})
export class AppModule { }
