import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCourseVersionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  freePreviewEnabled?: boolean;
}
