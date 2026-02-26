import { IsString } from 'class-validator';

export class AutosaveLessonDto {
  @IsString()
  markdownBody!: string;
}
