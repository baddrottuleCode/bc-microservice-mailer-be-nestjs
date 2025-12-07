import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { HealthModule } from 'bc-library-healthcheck-be-nestjs';

@Module({
  imports: [EmailModule, HealthModule],
})
export class AppModule {}