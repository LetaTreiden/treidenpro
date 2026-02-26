import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModuleRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';
}
