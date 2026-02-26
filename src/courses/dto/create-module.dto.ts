import { IsInt, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}
