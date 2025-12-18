import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { User } from './users/user.entity';
import { Session } from './sessions/session.entity';

@Module({
  imports: [
    // 1. Load env variables globally
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available everywhere
      envFilePath: ['../.env'],
    }),

    // 2. Configure TypeORM using forRootAsync
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT') || 5432,
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Session],
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    SessionsModule,
  ],
})
export class AppModule {}
