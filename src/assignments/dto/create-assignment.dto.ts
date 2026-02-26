import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  courseVersionId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;
}
