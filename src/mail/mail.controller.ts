import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MailSenderService } from '../services/mail-sender.service';
import {
  WelcomeEmailDto,
  VerificationEmailDto,
  PasswordResetEmailDto,
  PasswordChangedEmailDto,
  FriendRequestEmailDto,
  FriendAcceptedEmailDto,
  CustomEmailDto,
  TemplateEmailDto,
} from './dto/mail.dto';

@Controller('email')
export class MailController {
  constructor(private readonly mailSenderService: MailSenderService) {}

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  async sendWelcome(@Body() dto: WelcomeEmailDto) {
    const result = await this.mailSenderService.sendWelcomeEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('verification')
  @HttpCode(HttpStatus.OK)
  async sendVerification(@Body() dto: VerificationEmailDto) {
    const result = await this.mailSenderService.sendVerificationEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
      dto.verificationToken,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordReset(@Body() dto: PasswordResetEmailDto) {
    const result = await this.mailSenderService.sendPasswordResetEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
      dto.resetToken,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('password-changed')
  @HttpCode(HttpStatus.OK)
  async sendPasswordChanged(@Body() dto: PasswordChangedEmailDto) {
    const result = await this.mailSenderService.sendPasswordChangedEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('friend-request')
  @HttpCode(HttpStatus.OK)
  async sendFriendRequest(@Body() dto: FriendRequestEmailDto) {
    const result = await this.mailSenderService.sendFriendRequestEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
      dto.senderName,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('friend-accepted')
  @HttpCode(HttpStatus.OK)
  async sendFriendAccepted(@Body() dto: FriendAcceptedEmailDto) {
    const result = await this.mailSenderService.sendFriendAcceptedEmail(
      dto.serviceKey,
      dto.to,
      dto.name,
      dto.friendName,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('custom')
  @HttpCode(HttpStatus.OK)
  async sendCustom(@Body() dto: CustomEmailDto) {
    const result = await this.mailSenderService.sendCustomEmail(
      dto.serviceKey,
      dto.to,
      dto.subject,
      dto.html,
      dto.text,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  // Invio email usando un template specifico con variabili dinamiche
  @Post('template')
  @HttpCode(HttpStatus.OK)
  async sendWithTemplate(@Body() dto: TemplateEmailDto) {
    const result = await this.mailSenderService.sendWithTemplate(
      dto.serviceKey,
      dto.templateType,
      dto.to,
      dto.variables,
    );
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }
}