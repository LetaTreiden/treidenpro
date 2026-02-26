import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
