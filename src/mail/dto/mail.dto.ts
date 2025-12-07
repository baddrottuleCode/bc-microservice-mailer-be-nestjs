import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { TemplateType } from '../entities/mail.entity';

// ============================================
// DTOs per la gestione dei servizi
// ============================================

export class CreateMailServiceDto {
  @IsString()
  @IsNotEmpty()
  serviceKey: string;

  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @IsString()
  @IsNotEmpty()
  frontendUrl: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsString()
  @IsNotEmpty()
  smtpHost: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  smtpPort: number;

  @IsBoolean()
  smtpSecure: boolean;

  @IsString()
  @IsNotEmpty()
  smtpUser: string;

  @IsString()
  @IsNotEmpty()
  smtpPassword: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  // Colori opzionali
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  cardColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  mutedTextColor?: string;
}

export class UpdateMailServiceDto {
  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @IsOptional()
  @IsString()
  frontendUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  cardColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  mutedTextColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// DTOs per la gestione dei template
// ============================================

export class CreateMailTemplateDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  templateType: TemplateType;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  htmlTemplate: string;

  @IsOptional()
  @IsString()
  textTemplate?: string;

  @IsOptional()
  availableVariables?: string[];
}

export class UpdateMailTemplateDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @IsOptional()
  @IsString()
  textTemplate?: string;

  @IsOptional()
  availableVariables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// DTOs per l'invio email
// ============================================

// Base DTO per tutte le email
export class BaseEmailDto {
  @IsString()
  @IsNotEmpty()
  serviceKey: string;  // Identifica quale servizio sta inviando

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
  @IsString()
  @IsNotEmpty()
  serviceKey: string;

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

// Email con template dinamico
export class TemplateEmailDto {
  @IsString()
  @IsNotEmpty()
  serviceKey: string;

  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  templateType: TemplateType;

  // Variabili da sostituire nel template
  // Es: { name: "Mario", verificationToken: "abc123" }
  variables: Record<string, string>;
}