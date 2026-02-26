import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  courseId!: string;

  @IsInt()
  @Min(1)
  amountRub!: number;

  @IsOptional()
  @IsString()
  accessType?: 'LIFETIME' | 'TEMPORARY';

  @IsOptional()
  @IsInt()
  @Min(1)
  accessDays?: number;
}
