import { IsIn, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLessonRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  markdownBody?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
