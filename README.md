# Healhcare Scheduling System

Sistem penjadwalan janji temu dokter dan pasien berbasis microservices yang dibangun dengan NestJS, GraphQL, PostgreSQL, dan Redis.

## Arsitektur Sistem
![alt text](<Healthcare Scheduling System Architecture.jpg>)

## Cara Menjalankan

### Prasyarat

- Docker & Docker Compose
- Node.js 20+ (untuk pengembangan lokal)
- npm atau yarn

### Menjalankan dengan Docker

1. **Clone dan setup environment:**
   ```bash
   cp .env.example .env
   # Edit file .env sesuai konfigurasi yang diinginkan
   ```

2. **Jalankan semua service:**
   ```bash
   docker compose up -d --build
   ```

3. **Akses GraphQL Playground:**
   - Auth Service: http://localhost:3001/graphql
   - Schedule Service: http://localhost:3002/graphql

### Local Development

1. **Install dependencies:**
   ```bash
   # Auth Service
   cd auth-service && npm install

   # Schedule Service
   cd schedule-service && npm install
   ```

2. **Setup database:**
   ```bash
   # Jalankan PostgreSQL & Redis
   docker compose up -d postgres redis

   # Generate Prisma client & migrasi
   cd auth-service && npx prisma generate && npx prisma db push
   cd schedule-service && npx prisma generate && npx prisma db push
   ```

3. **Jalankan services:**
   ```bash
   # Terminal 1 - Auth Service
   cd auth-service && npm run start:dev

   # Terminal 2 - Schedule Service
   cd schedule-service && npm run start:dev
   ```

## Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `NODE_ENV` | Mode environment | `development` |
| `POSTGRES_USER` | Username PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Password PostgreSQL | `postgres` |
| `POSTGRES_DB` | Nama database | `healthcare-scheduling` |
| `AUTH_SERVICE_PORT` | Port auth service | `3001` |
| `SCHEDULE_SERVICE_PORT` | Port schedule service | `3002` |
| `JWT_SECRET` | Secret key untuk JWT tokens | `healthcare-scheduling-secret` |
| `REDIS_HOST` | Host Redis | `redis` |
| `REDIS_PORT` | Port Redis | `6379` |
| `SMTP_HOST` | Host server SMTP | - |
| `SMTP_PORT` | Port server SMTP | `587` |
| `SMTP_USER` | Username SMTP | - |
| `SMTP_PASSWORD` | Password SMTP | - |
| `SMTP_FROM_EMAIL` | Alamat email pengirim | `noreply@example.com` |

## Contoh GraphQL Queries/Mutations

### Autentikasi

**Registrasi User:**
```graphql
mutation {
  register(input: {
    email: "ammarizzdn@gmail.com"
    password: "password12345"
    confirmPassword: "password12345"
  }) {
    id
    email
    createdAt
    updatedAt
  }
}
```

**Login:**
```graphql
mutation {
  login(input: {
    email: "ammarizzdn@gmail.com"
    password: "password12345"
  }) {
    user {
      id
      email
      createdAt
      updatedAt
    }
    accessToken
  }
}
```

### Manajemen Customer

> Tambahkan header: `Authorization: Bearer <token>`

**Buat Customer:**
```graphql
mutation {
  createCustomer(input: {
    name: "Muhammad Ammar Izzudin"
    email: "ammarizzdn@gmail.com"
  }) {
    id
    name
    email
    createdAt
    updatedAt
  }
}
```

**List Customer:**
```graphql
query {
  customers(page: 1, limit: 10) {
    data {
      id
      name
      email
      createdAt
      updatedAt
    }
    total
    page
  }
}
```

**Update Customer:**
```graphql
mutation {
  updateCustomer(id: "customer-uuid", input: {
    name: "Nama Baru"
    email: "email.baru@example.com"
  }) {
    id
    name
    email
    createdAt
    updatedAt
  }
}
```

**Delete Customer:**
```graphql
mutation {
  deleteCustomer(id: "customer-uuid") {
    id
    name
    email
  }
}
```

### Manajemen Dokter

**Buat Dokter:**
```graphql
mutation {
  createDoctor(input: {
    name: "dr. Muhammad Ammar Izzudin"
  }) {
    id
    name
    createdAt
    updatedAt
  }
}
```

**List Dokter:**
```graphql
query {
  doctors(page: 1, limit: 10) {
    data {
      id
      name
      createdAt
      updatedAt
    }
    total
  }
}
```

**Update Dokter:**
```graphql
mutation {
  updateDoctor(id: "doctor-uuid", input: {
    name: "dr. Nama Baru"
  }) {
    id
    name
    createdAt
    updatedAt
  }
}
```

**Delete Dokter:**
```graphql
mutation {
  deleteDoctor(id: "doctor-uuid") {
    id
    name
  }
}
```

### Penjadwalan Janji Temu

**Buat Jadwal:**
```graphql
mutation {
  createSchedule(input: {
    customerId: "customer-uuid"
    doctorId: "doctor-uuid"
    objective: "Pemeriksaan tahunan"
    scheduledAt: "2025-01-09T09:00:00+07:00"
  }) {
    id
    objective
    scheduledAt
    customer { name }
    doctor { name }
    createdAt
    updatedAt
  }
}
```

**List Jadwal:**
```graphql
query {
  schedules(page: 1, limit: 10) {
    data {
      id
      objective
      scheduledAt
      customer { name email }
      doctor { name }
      createdAt
      updatedAt
    }
    total
  }
}
```

**Hapus Jadwal:**
```graphql
mutation {
  deleteSchedule(id: "schedule-uuid") {
    id
    objective
  }
}
```

## Menjalankan Test

```bash
# Auth Service
cd auth-service && npm test

# Schedule Service  
cd schedule-service && npm test

# Dengan coverage
npm run test:cov
```
## Struktur Project

```
healthcare-scheduling/
├── auth-service/
│   ├── src/
│   │   ├── auth/
│   │   └── prisma/
│   └── Dockerfile
├── schedule-service/
│   ├── src/
│   │   ├── customer/
│   │   ├── doctor/
│   │   ├── schedule/
│   │   ├── email/
│   │   └── prisma/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```