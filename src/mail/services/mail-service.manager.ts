import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { FirestoreService } from 'bc-library-firestore-nestjs';
import { MailService } from '../entities/mail.entity';
import { CreateMailServiceDto, UpdateMailServiceDto } from '../dto/mail.dto';

@Injectable()
export class MailServiceManager {
  private readonly logger = new Logger(MailServiceManager.name);
  private readonly COLLECTION = 'mail_services';

  // Cache dei servizi per evitare query ripetute
  private serviceCache: Map<string, MailService> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minuti

  constructor(private firestoreService: FirestoreService) {}

  async create(dto: CreateMailServiceDto): Promise<MailService> {
    // Verifica che il serviceKey sia unico
    const existing = await this.findByServiceKey(dto.serviceKey);
    if (existing) {
      throw new ConflictException(`Service with key "${dto.serviceKey}" already exists`);
    }

    const now = new Date();
    const serviceData: Omit<MailService, 'id'> = {
      ...dto,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.firestoreService.createDocument(this.COLLECTION, serviceData);
    this.logger.log(`Created mail service: ${dto.serviceKey}`);
    
    // Invalida cache
    this.serviceCache.delete(dto.serviceKey);
    
    return created as MailService;
  }

  async findAll(): Promise<MailService[]> {
    const services = await this.firestoreService.getAllDocuments<MailService>(this.COLLECTION);
    return services;
  }

  async findById(id: string): Promise<MailService> {
    const service = await this.firestoreService.getDocument<MailService>(this.COLLECTION, id);
    if (!service) {
      throw new NotFoundException(`Mail service with id "${id}" not found`);
    }
    return service;
  }

  async findByServiceKey(serviceKey: string): Promise<MailService | null> {
    // Check cache first
    const cached = this.serviceCache.get(serviceKey);
    const expiry = this.cacheExpiry.get(serviceKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    const services = await this.firestoreService.queryDocuments<MailService>(
      this.COLLECTION,
      'serviceKey',
      '==',
      serviceKey,
    );

    if (services.length === 0) {
      return null;
    }

    const service = services[0];
    
    // Update cache
    this.serviceCache.set(serviceKey, service);
    this.cacheExpiry.set(serviceKey, Date.now() + this.CACHE_TTL);

    return service;
  }

  async getActiveService(serviceKey: string): Promise<MailService> {
    const service = await this.findByServiceKey(serviceKey);
    
    if (!service) {
      throw new NotFoundException(`Mail service "${serviceKey}" not found`);
    }
    
    if (!service.isActive) {
      throw new NotFoundException(`Mail service "${serviceKey}" is not active`);
    }

    return service;
  }

  async update(id: string, dto: UpdateMailServiceDto): Promise<MailService> {
    const existing = await this.findById(id);

    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    await this.firestoreService.updateDocument(this.COLLECTION, id, updateData);
    
    // Invalida cache
    this.serviceCache.delete(existing.serviceKey);
    
    this.logger.log(`Updated mail service: ${existing.serviceKey}`);
    
    return { ...existing, ...updateData };
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    await this.firestoreService.deleteDocument(this.COLLECTION, id);
    
    // Invalida cache
    this.serviceCache.delete(existing.serviceKey);
    
    this.logger.log(`Deleted mail service: ${existing.serviceKey}`);
  }

  async deactivate(id: string): Promise<MailService> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<MailService> {
    return this.update(id, { isActive: true });
  }

  // Pulisce la cache manualmente
  clearCache(): void {
    this.serviceCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('Mail service cache cleared');
  }
}