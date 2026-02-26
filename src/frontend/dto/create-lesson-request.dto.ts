import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonRequestDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  markdownBody?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
