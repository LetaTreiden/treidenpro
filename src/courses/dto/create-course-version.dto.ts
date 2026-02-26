import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseVersionDto {
  @IsInt()
  @Min(1)
  versionNumber!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  freePreviewEnabled?: boolean;
}
