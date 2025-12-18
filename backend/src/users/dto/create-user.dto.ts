import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Username must be at least 6 characters long' })
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
