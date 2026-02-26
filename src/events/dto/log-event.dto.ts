import { IsObject, IsOptional, IsString } from 'class-validator';

export class LogEventDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  eventName!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
