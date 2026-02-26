import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttemptAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  answerId?: string;

  @IsOptional()
  @IsString()
  answerText?: string;
}

export class SubmitTestAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerDto)
  answers!: AttemptAnswerDto[];
}
