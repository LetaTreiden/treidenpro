import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderLessonsRequestDto {
  @IsString()
  moduleId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  lessonIds!: string[];
}
