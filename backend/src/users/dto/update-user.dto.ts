import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../user.entity';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
