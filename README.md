# treiden.pro Backend (NestJS + Prisma + Redis)

Production-ready backend skeleton for the educational platform with:
- TypeScript + NestJS REST API
- PostgreSQL + Prisma
- Redis caching
- JWT auth (email/password, Yandex, Telegram)
- Course versioning (including free preview levels)
- Tests/diagnostics, assignments/reviews, certificates
- YooKassa payments + webhook handling
- Ratings/leaderboard + event analytics

## Quick Start

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name frontend_openapi_alignment
npm run prisma:seed
npm run start:dev
```

API prefix: `api`
Frontend base URL: `http://localhost:3000/api`

## Seed Admin

```bash
npm run prisma:seed
```

Defaults from `.env`:
- `ADMIN_EMAIL=admin@treiden.pro`
- `ADMIN_PASSWORD=Admin123!`
- `ADMIN_NAME=Treiden Admin`

## Docker

```bash
docker-compose up --build
```

## Folder Structure

```txt
prisma/
  schema.prisma
src/
  access/
  admin/
  assignments/
  auth/
  certificates/
  common/
  config/
  courses/
  events/
  payments/
  prisma/
  ratings/
  redis/
  tests/
  users/
```

## Core Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/yandex`
- `POST /api/auth/telegram`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/me` (frontend contract profile endpoint)

### Frontend Contract (Tracks/Modules/Lessons/Progress)
- `GET /api/tracks`
- `GET /api/tracks/:trackId`
- `GET /api/tracks/:trackId/modules`
- `POST /api/tracks/:trackId/modules` (admin)
- `PATCH /api/modules/:moduleId` (admin)
- `PATCH /api/modules/reorder` (admin)
- `GET /api/modules/:moduleId/lessons`
- `POST /api/modules/:moduleId/lessons` (admin)
- `GET /api/lessons/:lessonId`
- `PATCH /api/lessons/:lessonId` (admin)
- `POST /api/lessons/:lessonId/publish` (admin)
- `POST /api/lessons/:lessonId/draft` (admin)
- `POST /api/lessons/:lessonId/autosave` (admin)
- `PATCH /api/lessons/reorder` (admin)
- `GET /api/lessons/:lessonId/versions`
- `POST /api/lessons/:lessonId/restore/:versionId` (admin)
- `GET /api/progress/summary`
- `GET /api/progress/tracks/:trackId`
- `GET /api/progress/modules/:moduleId`
- `POST /api/progress/lessons/:lessonId/complete`

### Courses + Versions + Content
- `GET /api/courses`
- `GET /api/courses/:courseId`
- `GET /api/courses/:courseId/versions/:versionId/outline`
- `GET /api/courses/:courseId/versions/:versionId/content`
- `POST /api/courses` (admin)
- `PATCH /api/courses/:courseId` (admin)
- `POST /api/courses/:courseId/versions` (admin)
- `PATCH /api/courses/:courseId/versions/:versionId` (admin)
- `POST /api/courses/versions/:versionId/sections` (admin)
- `POST /api/courses/sections/:sectionId/modules` (admin)
- `POST /api/courses/modules/:moduleId/lessons` (admin)
- `POST /api/courses/lessons/:lessonId/content-blocks` (admin)

### Tests + Diagnostic
- `POST /api/tests` (admin)
- `GET /api/tests/:testId/start`
- `POST /api/tests/:testId/attempts`
- `GET /api/tests/diagnostic/recommendation/me`

### Assignments
- `POST /api/assignments` (admin)
- `GET /api/assignments/:assignmentId`
- `POST /api/assignments/:assignmentId/submissions`
- `GET /api/assignments/:assignmentId/submissions/me`
- `GET /api/assignments/submissions/pending` (admin/reviewer)
- `PATCH /api/assignments/submissions/:submissionId/review` (admin/reviewer)

### Certificates
- `POST /api/certificates/issue` (admin)
- `GET /api/certificates/me`
- `GET /api/certificates/verify/:serial`

### Access + Ratings
- `GET /api/access/me`
- `GET /api/ratings/leaderboard`
- `GET /api/ratings/me`

### Payments (YooKassa)
- `POST /api/payments/orders`
- `GET /api/payments/orders/me`
- `POST /api/payments/yookassa/webhook`

### Admin Panel API
- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/events`
- `GET /api/admin/events/recent`
- `GET /api/admin/submissions/pending`
- `PATCH /api/admin/submissions/:submissionId/review`
- `POST /api/admin/certificates/issue`
- `POST /api/admin/courses`
- `PATCH /api/admin/courses/:courseId`
- `POST /api/admin/courses/:courseId/versions`
- `PATCH /api/admin/courses/:courseId/versions/:versionId`
- `POST /api/admin/tests`
- `POST /api/admin/assignments`
- `POST /api/admin/payments/orders/:userId`

## Notes
- Telegram/Yandex verification points are marked with production TODOs for full provider-side signature/token validation.
- YooKassa webhook verification is implemented as sample HMAC verification with `x-yookassa-signature`.
- Request event logging is global via interceptor and stored in `EventLog`.
