import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    const serviceName = process.env.APP_NAME;
    const serviceDescription = process.env.APP_DESCRIPTION;

    return {
      status: 'ok',
      service: serviceName,
      description: serviceDescription,
      timestamp: new Date().toISOString()
    };
  }
}
