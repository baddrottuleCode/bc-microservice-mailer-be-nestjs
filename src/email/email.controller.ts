import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  WelcomeEmailDto,
  VerificationEmailDto,
  PasswordResetEmailDto,
  PasswordChangedEmailDto,
  FriendRequestEmailDto,
  FriendAcceptedEmailDto,
  CustomEmailDto,
} from './dto/email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  async sendWelcome(@Body() dto: WelcomeEmailDto) {
    const result = await this.emailService.sendWelcomeEmail(dto.to, dto.name);
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('verification')
  @HttpCode(HttpStatus.OK)
  async sendVerification(@Body() dto: VerificationEmailDto) {
    const result = await this.emailService.sendVerificationEmail(
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
    const result = await this.emailService.sendPasswordResetEmail(
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
    const result = await this.emailService.sendPasswordChangedEmail(dto.to, dto.name);
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('friend-request')
  @HttpCode(HttpStatus.OK)
  async sendFriendRequest(@Body() dto: FriendRequestEmailDto) {
    const result = await this.emailService.sendFriendRequestEmail(
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
    const result = await this.emailService.sendFriendAcceptedEmail(
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
    const result = await this.emailService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
    });
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }
}