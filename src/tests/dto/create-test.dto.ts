import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateAnswerDto {
  @IsString()
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}

class CreateQuestionDto {
  @IsString()
  prompt!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers!: CreateAnswerDto[];
}

export class CreateTestDto {
  @IsString()
  title!: string;

  @IsString()
  type!: 'LESSON' | 'MODULE' | 'COURSE' | 'DIAGNOSTIC';

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  courseVersionId?: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  passScore?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleAnswers?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}
