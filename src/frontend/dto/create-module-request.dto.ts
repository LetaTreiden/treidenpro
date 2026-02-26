import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleRequestDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
