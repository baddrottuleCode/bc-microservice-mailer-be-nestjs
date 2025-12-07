import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class BaseEmailDto {
  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty({ message: 'Email obbligatoria' })
  to: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome obbligatorio' })
  name: string;
}

export class WelcomeEmailDto extends BaseEmailDto {}

export class VerificationEmailDto extends BaseEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Token di verifica obbligatorio' })
  verificationToken: string;
}

export class PasswordResetEmailDto extends BaseEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Token di reset obbligatorio' })
  resetToken: string;
}

export class PasswordChangedEmailDto extends BaseEmailDto {}

export class FriendRequestEmailDto extends BaseEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome del mittente obbligatorio' })
  senderName: string;
}

export class FriendAcceptedEmailDto extends BaseEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome dell\'amico obbligatorio' })
  friendName: string;
}

export class CustomEmailDto {
  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty({ message: 'Email obbligatoria' })
  to: string;

  @IsString()
  @IsNotEmpty({ message: 'Oggetto obbligatorio' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Contenuto HTML obbligatorio' })
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}