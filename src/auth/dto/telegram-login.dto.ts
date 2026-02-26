import { IsOptional, IsString } from 'class-validator';

export class TelegramLoginDto {
  @IsString()
  telegramId!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}
