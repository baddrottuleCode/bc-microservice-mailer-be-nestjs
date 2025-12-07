import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MailServiceManager } from '../services/mail-service.manager';
import { MailTemplateManager } from '../services/mail-template.manager';
import { MailSenderService } from '../services/mail-sender.service';
import {
  CreateMailServiceDto,
  UpdateMailServiceDto,
  CreateMailTemplateDto,
  UpdateMailTemplateDto,
} from './dto/mail.dto';

@Controller('admin/services')
export class MailAdminController {
  constructor(
    private mailServiceManager: MailServiceManager,
    private mailTemplateManager: MailTemplateManager,
    private mailSenderService: MailSenderService,
  ) {}

  // =====================================
  // CRUD Servizi
  // =====================================

  @Post()
  async createService(@Body() dto: CreateMailServiceDto) {
    const service = await this.mailServiceManager.create(dto);
    return {
      success: true,
      service,
      message: 'Service created successfully',
    };
  }

  @Get()
  async getAllServices() {
    const services = await this.mailServiceManager.findAll();
    // Nascondi le password nella risposta
    const sanitized = services.map(s => ({
      ...s,
      smtpPassword: '***',
    }));
    return { services: sanitized };
  }

  @Get(':id')
  async getService(@Param('id') id: string) {
    const service = await this.mailServiceManager.findById(id);
    return {
      ...service,
      smtpPassword: '***',
    };
  }

  @Put(':id')
  async updateService(@Param('id') id: string, @Body() dto: UpdateMailServiceDto) {
    const service = await this.mailServiceManager.update(id, dto);
    
    // Se cambiano le credenziali SMTP, invalida il transporter cache
    if (dto.smtpHost || dto.smtpPort || dto.smtpUser || dto.smtpPassword) {
      this.mailSenderService.invalidateTransporter(id);
    }
    
    return {
      success: true,
      service: { ...service, smtpPassword: '***' },
      message: 'Service updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteService(@Param('id') id: string) {
    await this.mailServiceManager.delete(id);
    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }

  @Post(':id/activate')
  async activateService(@Param('id') id: string) {
    const service = await this.mailServiceManager.activate(id);
    return {
      success: true,
      service: { ...service, smtpPassword: '***' },
      message: 'Service activated',
    };
  }

  @Post(':id/deactivate')
  async deactivateService(@Param('id') id: string) {
    const service = await this.mailServiceManager.deactivate(id);
    return {
      success: true,
      service: { ...service, smtpPassword: '***' },
      message: 'Service deactivated',
    };
  }

  // =====================================
  // CRUD Template per servizio
  // =====================================

  @Post(':serviceId/templates')
  async createTemplate(
    @Param('serviceId') serviceId: string,
    @Body() dto: Omit<CreateMailTemplateDto, 'serviceId'>,
  ) {
    const template = await this.mailTemplateManager.create({
      ...dto,
      serviceId,
    });
    return {
      success: true,
      template,
      message: 'Template created successfully',
    };
  }

  @Post(':serviceId/templates/defaults')
  async createDefaultTemplates(@Param('serviceId') serviceId: string) {
    // Verifica che il servizio esista
    await this.mailServiceManager.findById(serviceId);
    
    const templates = await this.mailTemplateManager.createDefaultTemplates(serviceId);
    return {
      success: true,
      templates,
      message: `Created ${templates.length} default templates`,
    };
  }

  @Get(':serviceId/templates')
  async getTemplates(@Param('serviceId') serviceId: string) {
    const templates = await this.mailTemplateManager.findAllByService(serviceId);
    return { templates };
  }

  @Get(':serviceId/templates/:templateId')
  async getTemplate(
    @Param('serviceId') serviceId: string,
    @Param('templateId') templateId: string,
  ) {
    const template = await this.mailTemplateManager.findById(templateId);
    return template;
  }

  @Put(':serviceId/templates/:templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateMailTemplateDto,
  ) {
    const template = await this.mailTemplateManager.update(templateId, dto);
    return {
      success: true,
      template,
      message: 'Template updated successfully',
    };
  }

  @Delete(':serviceId/templates/:templateId')
  @HttpCode(HttpStatus.OK)
  async deleteTemplate(@Param('templateId') templateId: string) {
    await this.mailTemplateManager.delete(templateId);
    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  // =====================================
  // Cache management
  // =====================================

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  clearAllCaches() {
    this.mailServiceManager.clearCache();
    this.mailTemplateManager.clearCache();
    return {
      success: true,
      message: 'All caches cleared',
    };
  }
}