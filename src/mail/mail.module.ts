import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailAdminController } from './mail-admin.controller';
import { MailSenderService } from '../services/mail-sender.service';
import { MailServiceManager } from '../services/mail-service.manager';
import { MailTemplateManager } from '../services/mail-template.manager';

@Module({
  controllers: [MailController, MailAdminController],
  providers: [MailSenderService, MailServiceManager, MailTemplateManager],
  exports: [MailSenderService, MailServiceManager, MailTemplateManager],
})
export class MailModule {}