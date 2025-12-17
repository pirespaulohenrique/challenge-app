import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import this
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
      envFilePath: '.env', // Looks for the .env file in the root
    }),

    // 2. Configure TypeORM using those variables
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD, // Now this will be defined
      database: process.env.DATABASE_NAME,
      entities: [User, Session],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    SessionsModule,
  ],
})
export class AppModule {}
