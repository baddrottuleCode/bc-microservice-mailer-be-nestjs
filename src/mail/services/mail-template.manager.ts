import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { FirestoreService } from 'bc-library-firestore-be-nestjs';
import { MailTemplate, TemplateType } from '../entities/mail.entity';
import { CreateMailTemplateDto, UpdateMailTemplateDto } from '../dto/mail.dto';

@Injectable()
export class MailTemplateManager {
  private readonly logger = new Logger(MailTemplateManager.name);
  private readonly COLLECTION = 'mail_templates';

  // Cache dei template per servizio
  private templateCache: Map<string, Map<TemplateType, MailTemplate>> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minuti

  constructor(private firestoreService: FirestoreService) {}

  async create(dto: CreateMailTemplateDto): Promise<MailTemplate> {
    // Verifica che non esista già un template dello stesso tipo per questo servizio
    const existing = await this.findByServiceAndType(dto.serviceId, dto.templateType);
    if (existing) {
      throw new ConflictException(
        `Template "${dto.templateType}" already exists for service "${dto.serviceId}"`,
      );
    }

    const now = new Date();
    const templateData: Omit<MailTemplate, 'id'> = {
      ...dto,
      availableVariables: dto.availableVariables || this.getDefaultVariables(dto.templateType),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.firestoreService.createDocument(this.COLLECTION, templateData);
    this.logger.log(`Created template "${dto.templateType}" for service "${dto.serviceId}"`);

    // Invalida cache
    this.invalidateCacheForService(dto.serviceId);

    return created as MailTemplate;
  }

  async findAllByService(serviceId: string): Promise<MailTemplate[]> {
    const templates = await this.firestoreService.queryDocuments<MailTemplate>(
      this.COLLECTION,
      'serviceId',
      '==',
      serviceId,
    );
    return templates;
  }

  async findById(id: string): Promise<MailTemplate> {
    const template = await this.firestoreService.getDocument<MailTemplate>(this.COLLECTION, id);
    if (!template) {
      throw new NotFoundException(`Template with id "${id}" not found`);
    }
    return template;
  }

  async findByServiceAndType(serviceId: string, templateType: TemplateType): Promise<MailTemplate | null> {
    // Check cache first
    const serviceTemplates = this.templateCache.get(serviceId);
    const expiry = this.cacheExpiry.get(serviceId);

    if (serviceTemplates && expiry && Date.now() < expiry) {
      return serviceTemplates.get(templateType) || null;
    }

    // Query Firestore
    const firestore = this.firestoreService.getFirestore();
    const snapshot = await firestore
      .collection(this.COLLECTION)
      .where('serviceId', '==', serviceId)
      .where('templateType', '==', templateType)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as MailTemplate;
  }

  async getActiveTemplate(serviceId: string, templateType: TemplateType): Promise<MailTemplate | null> {
    const template = await this.findByServiceAndType(serviceId, templateType);

    if (!template || !template.isActive) {
      return null;
    }

    return template;
  }

  async getAllTemplatesForService(serviceId: string): Promise<Map<TemplateType, MailTemplate>> {
    // Check cache
    const cached = this.templateCache.get(serviceId);
    const expiry = this.cacheExpiry.get(serviceId);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Query all templates for service
    const templates = await this.findAllByService(serviceId);
    
    const templateMap = new Map<TemplateType, MailTemplate>();
    templates.forEach(t => {
      if (t.isActive) {
        templateMap.set(t.templateType, t);
      }
    });

    // Update cache
    this.templateCache.set(serviceId, templateMap);
    this.cacheExpiry.set(serviceId, Date.now() + this.CACHE_TTL);

    return templateMap;
  }

  async update(id: string, dto: UpdateMailTemplateDto): Promise<MailTemplate> {
    const existing = await this.findById(id);

    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    await this.firestoreService.updateDocument(this.COLLECTION, id, updateData);

    // Invalida cache
    this.invalidateCacheForService(existing.serviceId);

    this.logger.log(`Updated template "${existing.templateType}" for service "${existing.serviceId}"`);

    return { ...existing, ...updateData };
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    await this.firestoreService.deleteDocument(this.COLLECTION, id);

    // Invalida cache
    this.invalidateCacheForService(existing.serviceId);

    this.logger.log(`Deleted template "${existing.templateType}" for service "${existing.serviceId}"`);
  }

  // Crea tutti i template di default per un servizio
  async createDefaultTemplates(serviceId: string): Promise<MailTemplate[]> {
    const defaultTemplates = this.getDefaultTemplates(serviceId);
    const created: MailTemplate[] = [];

    for (const template of defaultTemplates) {
      try {
        const result = await this.create(template);
        created.push(result);
      } catch (error) {
        // Template già esistente, skip
        this.logger.warn(`Template ${template.templateType} already exists, skipping`);
      }
    }

    return created;
  }

  private invalidateCacheForService(serviceId: string): void {
    this.templateCache.delete(serviceId);
    this.cacheExpiry.delete(serviceId);
  }

  // Pulisce tutta la cache
  clearCache(): void {
    this.templateCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('Template cache cleared');
  }

  // Variabili di default per ogni tipo di template
  private getDefaultVariables(templateType: TemplateType): string[] {
    const variablesMap: Record<TemplateType, string[]> = {
      welcome: ['name'],
      verification: ['name', 'verificationToken', 'verificationUrl'],
      password_reset: ['name', 'resetToken', 'resetUrl'],
      password_changed: ['name'],
      friend_request: ['name', 'senderName'],
      friend_accepted: ['name', 'friendName'],
      custom: [],
    };
    return variablesMap[templateType] || [];
  }

  // Template di default (HTML base)
  private getDefaultTemplates(serviceId: string): CreateMailTemplateDto[] {
    return [
      {
        serviceId,
        templateType: 'welcome',
        subject: '🎉 Benvenuto su {{serviceName}}!',
        htmlTemplate: this.getWelcomeTemplate(),
        availableVariables: ['name', 'serviceName', 'frontendUrl'],
      },
      {
        serviceId,
        templateType: 'verification',
        subject: '✉️ Verifica il tuo indirizzo email - {{serviceName}}',
        htmlTemplate: this.getVerificationTemplate(),
        availableVariables: ['name', 'serviceName', 'verificationUrl', 'frontendUrl'],
      },
      {
        serviceId,
        templateType: 'password_reset',
        subject: '🔐 Reset Password - {{serviceName}}',
        htmlTemplate: this.getPasswordResetTemplate(),
        availableVariables: ['name', 'serviceName', 'resetUrl', 'frontendUrl'],
      },
      {
        serviceId,
        templateType: 'password_changed',
        subject: '✅ Password modificata - {{serviceName}}',
        htmlTemplate: this.getPasswordChangedTemplate(),
        availableVariables: ['name', 'serviceName'],
      },
      {
        serviceId,
        templateType: 'friend_request',
        subject: '👋 {{senderName}} ti ha inviato una richiesta di amicizia!',
        htmlTemplate: this.getFriendRequestTemplate(),
        availableVariables: ['name', 'senderName', 'serviceName', 'frontendUrl'],
      },
      {
        serviceId,
        templateType: 'friend_accepted',
        subject: '🎉 {{friendName}} ha accettato la tua richiesta di amicizia!',
        htmlTemplate: this.getFriendAcceptedTemplate(),
        availableVariables: ['name', 'friendName', 'serviceName', 'frontendUrl'],
      },
    ];
  }

  // =====================================
  // Template HTML di default
  // Usano {{variabile}} come placeholder
  // =====================================

  private getBaseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: {{backgroundColor}}; color: {{textColor}}; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: {{cardColor}}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
    <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 30px; text-align: center;">
      {{#if logoUrl}}
      <img src="{{logoUrl}}" alt="{{serviceName}}" style="max-height: 50px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="margin: 0; font-size: 28px; color: white;">{{serviceName}}</h1>
    </div>
    <div style="padding: 40px 30px;">
      ${content}
    </div>
    <div style="background-color: {{footerColor}}; padding: 20px 30px; text-align: center; border-top: 1px solid #2a2a3e;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        © {{year}} {{serviceName}}. Tutti i diritti riservati.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getWelcomeTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: {{primaryColor}};">Ciao {{name}}!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Grazie per esserti registrato su <strong style="color: {{textColor}};">{{serviceName}}</strong>! 
        Siamo entusiasti di averti a bordo.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{frontendUrl}}" 
           style="display: inline-block; background: linear-gradient(135deg, {{primaryColor}}, {{primaryColorLight}}); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Inizia subito →
        </a>
      </div>
    `);
  }

  private getVerificationTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: {{primaryColor}};">Verifica la tua email</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Ciao <strong style="color: {{textColor}};">{{name}}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ✓ Verifica Email
        </a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Se il pulsante non funziona, copia e incolla questo link nel browser:
      </p>
      <p style="font-size: 12px; color: {{primaryColor}}; word-break: break-all;">
        {{verificationUrl}}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        ⏰ Questo link scadrà tra 24 ore.
      </p>
    `);
  }

  private getPasswordResetTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: #f59e0b;">🔐 Reset Password</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Ciao <strong style="color: {{textColor}};">{{name}}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Abbiamo ricevuto una richiesta per reimpostare la password del tuo account.
        Clicca sul pulsante qui sotto per creare una nuova password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          🔑 Reimposta Password
        </a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Se il pulsante non funziona, copia e incolla questo link nel browser:
      </p>
      <p style="font-size: 12px; color: {{primaryColor}}; word-break: break-all;">
        {{resetUrl}}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        ⏰ Questo link scadrà tra 1 ora.
      </p>
      <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px; color: #f87171;">
          ⚠️ Se non hai richiesto il reset della password, ignora questa email.
        </p>
      </div>
    `);
  }

  private getPasswordChangedTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: #10b981;">✅ Password modificata</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Ciao <strong style="color: {{textColor}};">{{name}}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        La tua password è stata modificata con successo.
      </p>
      <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px; color: #f87171;">
          ⚠️ Se non hai effettuato tu questa modifica, contattaci immediatamente.
        </p>
      </div>
    `);
  }

  private getFriendRequestTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: #a78bfa;">👋 Nuova richiesta di amicizia!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Ciao <strong style="color: {{textColor}};">{{name}}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        <strong style="color: {{textColor}};">{{senderName}}</strong> ti ha inviato una richiesta di amicizia su {{serviceName}}!
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{frontendUrl}}/friends" 
           style="display: inline-block; background: linear-gradient(135deg, #a78bfa, #818cf8); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Visualizza Richiesta →
        </a>
      </div>
    `);
  }

  private getFriendAcceptedTemplate(): string {
    return this.getBaseTemplate(`
      <h2 style="margin: 0 0 20px; color: #10b981;">🎉 Richiesta accettata!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        Ciao <strong style="color: {{textColor}};">{{name}}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: {{mutedTextColor}};">
        <strong style="color: {{textColor}};">{{friendName}}</strong> ha accettato la tua richiesta di amicizia!
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{frontendUrl}}/friends" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Vedi i tuoi amici →
        </a>
      </div>
    `);
  }
}