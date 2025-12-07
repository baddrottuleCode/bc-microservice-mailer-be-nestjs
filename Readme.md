# 📧 Email Microservice

Microservizio dedicato all'invio di email per Setlist Manager.

## 🚀 Features

- ✅ Invio email transazionali (verifica, reset password, etc.)
- ✅ Template HTML responsive e stilizzati
- ✅ Supporto SMTP configurabile
- ✅ Modalità development (log delle email)
- ✅ Pronto per Google Cloud Run

## 📁 Struttura

```
├── src/
│   ├── email/
│   │   ├── dto/
│   │   │   └── email.dto.ts       # DTOs per le richieste
│   │   ├── email.controller.ts    # Endpoints API
│   │   ├── email.service.ts       # Logica invio email + templates
│   │   └── email.module.ts
│   ├── health/
│   │   ├── health.controller.ts   # Health check
│   │   └── health.module.ts
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

Base URL: `/api`

### Health Check
```
GET /api/health
```

### Email di Benvenuto
```
POST /api/email/welcome
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "Mario Rossi"
}
```

### Email di Verifica
```
POST /api/email/verification
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "Mario Rossi",
  "verificationToken": "abc123..."
}
```

### Email Reset Password
```
POST /api/email/password-reset
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "Mario Rossi",
  "resetToken": "xyz789..."
}
```

### Email Password Cambiata
```
POST /api/email/password-changed
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "Mario Rossi"
}
```

### Email Richiesta Amicizia
```
POST /api/email/friend-request
Content-Type: application/json

{
  "to": "recipient@example.com",
  "name": "Nome Destinatario",
  "senderName": "Nome Mittente"
}
```

### Email Amicizia Accettata
```
POST /api/email/friend-accepted
Content-Type: application/json

{
  "to": "sender@example.com",
  "name": "Nome Mittente",
  "friendName": "Nome Amico"
}
```

### Email Personalizzata
```
POST /api/email/custom
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Oggetto email",
  "html": "<h1>Contenuto HTML</h1>",
  "text": "Contenuto testuale (opzionale)"
}
```

## 🛠️ Setup Locale

```bash
# Installa dipendenze
npm install

# Copia .env.example
cp .env.example .env

# Configura SMTP nel .env

# Avvia in development
npm run start:dev
```

## 🚢 Deploy su Cloud Run

```bash
# Deploy
./deploy.sh YOUR_PROJECT_ID europe-west1 email-microservice

# Configura variabili ambiente
gcloud run services update email-microservice \
  --region europe-west1 \
  --set-env-vars SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=your-email@gmail.com,SMTP_PASS=your-app-password,FRONTEND_URL=https://your-app.com
```

## 🔒 Sicurezza

Il microservizio è configurato con `--no-allow-unauthenticated` su Cloud Run.
Solo altri servizi autenticati (come il main microservice) possono chiamarlo.

Per comunicazione service-to-service su Cloud Run:
1. Il main microservice deve avere il ruolo `roles/run.invoker`
2. Usare un identity token per le chiamate

## 📝 Risposta API

Tutte le risposte seguono questo formato:

```json
{
  "success": true,
  "messageId": "message-id-from-smtp",
  "error": null
}
```

In caso di errore:
```json
{
  "success": false,
  "messageId": null,
  "error": "Descrizione errore"
}
```
