import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [EmailModule, HealthModule],
})
export class AppModule {}