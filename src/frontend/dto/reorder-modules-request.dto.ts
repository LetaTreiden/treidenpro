import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderModulesRequestDto {
  @IsString()
  trackId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  moduleIds!: string[];
}
