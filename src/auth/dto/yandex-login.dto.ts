import { IsEmail, IsOptional, IsString } from 'class-validator';

export class YandexLoginDto {
  @IsString()
  yandexId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  oauthCode?: string;
}
