import { IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
