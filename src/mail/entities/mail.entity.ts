// Configurazione di un servizio che usa il mailer
export interface MailService {
  id?: string;
  
  // Identificativo univoco del servizio (es: "setlist-manager", "my-app")
  serviceKey: string;
  
  // Info servizio
  serviceName: string;           // Nome visualizzato nelle email (es: "Setlist Manager")
  serviceDescription?: string;
  frontendUrl: string;           // URL del frontend per i link nelle email
  logoUrl?: string;              // URL del logo per le email
  
  // Configurazione SMTP
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;           // true per 465, false per altri
  smtpUser: string;
  smtpPassword: string;          // In produzione usare Secret Manager
  senderName?: string;           // Nome mittente (default: serviceName)
  senderEmail?: string;          // Email mittente (default: smtpUser)
  
  // Stile email (colori default)
  primaryColor?: string;         // Colore primario (default: #e94560)
  secondaryColor?: string;       // Colore secondario (default: #0f3460)
  backgroundColor?: string;      // Sfondo (default: #0f0f23)
  cardColor?: string;            // Sfondo card (default: #1a1a2e)
  textColor?: string;            // Colore testo (default: #f1f1f1)
  mutedTextColor?: string;       // Colore testo secondario (default: #a0a0a0)
  
  // Stato
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Tipi di template email supportati
export type TemplateType = 
  | 'welcome'
  | 'verification'
  | 'password_reset'
  | 'password_changed'
  | 'friend_request'
  | 'friend_accepted'
  | 'custom';

// Template email per un servizio
export interface MailTemplate {
  id?: string;
  
  // Riferimento al servizio
  serviceId: string;
  
  // Tipo di template
  templateType: TemplateType;
  
  // Contenuto
  subject: string;               // Oggetto email (può contenere {{variabili}})
  htmlTemplate: string;          // Template HTML (può contenere {{variabili}})
  textTemplate?: string;         // Template testo plain (opzionale)
  
  // Variabili disponibili per questo template
  // Es: ["name", "verificationToken", "verificationUrl"]
  availableVariables: string[];
  
  // Stato
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Response per le operazioni email
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Configurazione servizio con i suoi template (per cache)
export interface ServiceWithTemplates {
  service: MailService;
  templates: Map<TemplateType, MailTemplate>;
}