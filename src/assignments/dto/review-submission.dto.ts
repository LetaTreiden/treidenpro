import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReviewSubmissionDto {
  @IsInt()
  @Min(0)
  @Max(1000)
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  status?: 'REVIEWED' | 'RESUBMIT_REQUIRED';
}
