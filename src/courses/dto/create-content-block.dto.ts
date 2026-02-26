import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateContentBlockDto {
  @IsString()
  type!: 'TEXT' | 'VIDEO' | 'FILE' | 'QUIZ' | 'EMBED';

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
