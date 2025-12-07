import { Module } from '@nestjs/common';
import { FirestoreModule } from 'bc-library-firestore-be-nestjs';
import { HealthModule } from 'bc-library-healthcheck-be-nestjs';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    FirestoreModule,
    HealthModule,
    MailModule,
  ],
})
export class AppModule {}