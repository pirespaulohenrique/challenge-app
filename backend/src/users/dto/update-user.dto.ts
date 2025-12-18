import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../user.entity';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Username must be at least 6 characters long' })
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
