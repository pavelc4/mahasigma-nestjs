# Tutorial NestJS + Bun + PostgreSQL 

Tutorial lengkap membangun backend modular dengan NestJS, Bun, dan PostgreSQL.

---

## Prasyarat

1. **Bun** - [https://bun.sh](https://bun.sh)
2. **Docker** - Untuk menjalankan PostgreSQL
3. **Postman** - Untuk testing API
4. **Git** - Untuk clone repository
5. **Node.js** (Khusus Windows) - Jika tidak ingin pakai Bun

> **Catatan Pengguna Windows:**
> Jika Bun sulit diinstall di Windows, Anda bisa menggunakan `npm` bawaan Node.js.
> - Ganti `bun install` menjadi `npm install`
> - Ganti `bun run start:dev` menjadi `npm run start:dev`
> - Ganti `bun add` menjadi `npm install`

---

## Step 1: Clone & Install

```bash
# Clone starter template
git clone https://github.com/nestjs/typescript-starter.git uas
cd uas

# Install dependencies dengan Bun
bun install
# Atau jika pakai npm (Windows):
# npm install

# Install dependencies tambahan
bun add @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer @nestjs/mapped-types
# Atau pakai npm:
# npm install @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer @nestjs/mapped-types
```

---

## Step 2: Cleanup File Bawaan

Hapus file-file default yang tidak diperlukan:

```bash
# Hapus file bawaan
rm -f src/app.controller.ts
rm -f src/app.controller.spec.ts
rm -f src/app.service.ts

# Hapus folder test (opsional)
rm -rf test/
```

---

## Step 3: Setup Database (Docker)

Buat file `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: uas_postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

Buat file `.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=uas_project
```

Jalankan database:

```bash
docker compose up -d
```

---

## Step 3.1: Alternatif Database (XAMPP / MySQL / Laragon)

Buat pengguna yang tidak mau pakai Docker dan lebih suka XAMPP/Laragon:

1.  **Install Driver MySQL**:
    ```bash
    bun remove pg && bun add mysql2
    ```
2.  **Edit `src/common/database/database.module.ts`**:
    Ubah `type: 'postgres'` menjadi `type: 'mysql'`.
3.  **Edit `.env`** (Sesuaikan dengan Config XAMPP):
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USERNAME=root
    DB_PASSWORD=
    DB_NAME=uas_project
    ```
4.  **Buat Database**: Buka phpMyAdmin, buat database baru bernama `uas_project`.
5.  **Skip Step 3 (Docker)** dan langsung jalankan aplikasi.

---

---

## Step 4: Buat Struktur Folder

```bash
# Folder Common & Module Mahasiswa
mkdir -p src/common/database
mkdir -p src/common/interceptors
mkdir -p src/modules/mahasiswa/dto
mkdir -p src/modules/mahasiswa/entities

# Folder Module Health Check
mkdir -p src/modules/health
```

Struktur akhir:

```
src/
├── common/
│   ├── database/
│   │   └── database.module.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── modules/
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── mahasiswa/
│       ├── dto/
│       ├── entities/
│       ├── mahasiswa.controller.ts
│       ├── mahasiswa.module.ts
│       └── mahasiswa.service.ts
├── app.module.ts
└── main.ts
```

---

## Step 5: Kode Lengkap

### 5.1 `src/main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors();

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
```

### 5.2 `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { MahasiswaModule } from './modules/mahasiswa/mahasiswa.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MahasiswaModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 5.3 `src/common/database/database.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

### 5.4 `src/common/interceptors/transform.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
```

### 5.5 `src/modules/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 5.6 `src/modules/health/health.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

### 5.7 `src/modules/mahasiswa/entities/mahasiswa.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Mahasiswa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nim: string;

  @Column()
  nama: string;

  @Column()
  prodi: string;

  @Column()
  fakultas: string;

  @Column({ default: true })
  isActive: boolean;
}
```

### 5.8 `src/modules/mahasiswa/dto/create-mahasiswa.dto.ts`

```typescript
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateMahasiswaDto {
  @IsNotEmpty()
  @IsString()
  nim: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  nama: string;

  @IsNotEmpty()
  @IsString()
  prodi: string;

  @IsNotEmpty()
  @IsString()
  fakultas: string;
}
```

### 5.9 `src/modules/mahasiswa/dto/update-mahasiswa.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateMahasiswaDto } from './create-mahasiswa.dto';

export class UpdateMahasiswaDto extends PartialType(CreateMahasiswaDto) {}
```

### 5.10 `src/modules/mahasiswa/mahasiswa.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MahasiswaService } from './mahasiswa.service';
import { MahasiswaController } from './mahasiswa.controller';
import { Mahasiswa } from './entities/mahasiswa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mahasiswa])],
  controllers: [MahasiswaController],
  providers: [MahasiswaService],
})
export class MahasiswaModule {}
```

### 5.11 `src/modules/mahasiswa/mahasiswa.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMahasiswaDto } from './dto/create-mahasiswa.dto';
import { UpdateMahasiswaDto } from './dto/update-mahasiswa.dto';
import { Mahasiswa } from './entities/mahasiswa.entity';

@Injectable()
export class MahasiswaService {
  constructor(
    @InjectRepository(Mahasiswa)
    private readonly repo: Repository<Mahasiswa>,
  ) {}

  async create(dto: CreateMahasiswaDto) {
    const data = this.repo.create(dto);
    return await this.repo.save(data);
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: string) {
    const data = await this.repo.findOneBy({ id });
    if (!data) throw new NotFoundException(`ID ${id} tidak ditemukan`);
    return data;
  }

  async update(id: string, dto: UpdateMahasiswaDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`ID ${id} tidak ditemukan`);
    return { message: 'Berhasil dihapus' };
  }
}
```

### 5.12 `src/modules/mahasiswa/mahasiswa.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MahasiswaService } from './mahasiswa.service';
import { CreateMahasiswaDto } from './dto/create-mahasiswa.dto';
import { UpdateMahasiswaDto } from './dto/update-mahasiswa.dto';

@Controller('mahasiswa')
export class MahasiswaController {
  constructor(private readonly service: MahasiswaService) {}

  @Post()
  create(@Body() dto: CreateMahasiswaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMahasiswaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

---

## Step 6: Jalankan Aplikasi

```bash
# Pastikan database sudah jalan
docker compose up -d

# Jalankan server
bun run start:dev
```

Server berjalan di `http://localhost:3000`

---

## Step 7: Testing

### Opsi A: Auto Seed Data (Via Postman Runner)

Ingin isi 10 data "Sigma" sekaligus tanpa capek?

1. Download `postman/UAS_Seeder.postman_collection.json`
2. Import ke Postman.
3. Klik kanan pada Collection **UAS Backend - SEEDER**.
4. Pilih **Run Collection** -> Klik **Run**.
5. Wuzz! 10 data otomatis masuk.

### Opsi B: Import Postman Collection (Main)
1. Download file `postman/UAS_Backend.postman_collection.json`
2. Buka Postman -> Klik **Import** -> Pilih file tersebut.
3. Siap pakai! Script otomatis menyimpan `id` setelah create.

### Opsi C: Testing Manual (cURL)

**1. Tambah Data (POST)**
```bash
curl -X POST http://localhost:3000/mahasiswa \
  -H "Content-Type: application/json" \
  -d '{"nim":"12345","nama":"Budi Santoso","prodi":"TI","fakultas":"Ilmu Komputer"}'
```

**2. Lihat Semua (GET)**
```bash
curl http://localhost:3000/mahasiswa
```

**3. Update Data (PATCH)**
```bash
# Ganti UUID_DISINI dengan ID dari response POST
curl -X PATCH http://localhost:3000/mahasiswa/UUID_DISINI \
  -H "Content-Type: application/json" \
  -d '{"nama":"Budi Updated"}'
```

**4. Hapus Data (DELETE)**
```bash
curl -X DELETE http://localhost:3000/mahasiswa/UUID_DISINI
```

**5. Health Check**
```bash
curl http://localhost:3000/health
```

---

## Troubleshooting

| Error | Solusi |
| ----- | ------ |
| `Script not found "dev"` | Gunakan `bun run start:dev` |
| `Connection refused` | Cek `docker ps`, pastikan container jalan |
| `Port already allocated` | Ganti port di `docker-compose.yml` (misal 5433) |
| `Cannot find module` | Jalankan `bun install` ulang |

---

## Feature

Backend NestJS 

- Struktur Modular + Health Check
- PostgreSQL + TypeORM
- Full CRUD API (dengan Fakultas & Prodi)
- Validasi Input
- Error Handling
- Standard Response Format
