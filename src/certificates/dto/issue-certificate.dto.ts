import { IsObject, IsOptional, IsString } from 'class-validator';

export class IssueCertificateDto {
  @IsString()
  userId!: string;

  @IsString()
  courseId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
