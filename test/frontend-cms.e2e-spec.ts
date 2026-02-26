import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('Frontend CMS/Progress Contract (e2e)', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    courseVersion: {
      create: jest.fn(),
    },
    section: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    courseModule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    lesson: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    lessonVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    lessonProgress: {
      count: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    test: {
      count: jest.fn(),
    },
    testAttempt: {
      findMany: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
    },
  };

  const mockRedis = {
    getClient: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    return res.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const userPasswordHash = await bcrypt.hash('StrongPass123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: any }) => {
      if (where.email === 'existing@treiden.pro') {
        return Promise.resolve({
          id: 'user-1',
          email: 'existing@treiden.pro',
          passwordHash: userPasswordHash,
          displayName: 'Existing User',
          role: 'USER',
        });
      }

      if (where.email === 'admin@treiden.pro') {
        return Promise.resolve({
          id: 'admin-1',
          email: 'admin@treiden.pro',
          passwordHash: adminPasswordHash,
          displayName: 'Admin User',
          role: 'ADMIN',
        });
      }

      if (where.id === 'user-1') {
        return Promise.resolve({
          id: 'user-1',
          email: 'existing@treiden.pro',
          passwordHash: userPasswordHash,
          displayName: 'Existing User',
          role: 'USER',
        });
      }

      if (where.id === 'admin-1') {
        return Promise.resolve({
          id: 'admin-1',
          email: 'admin@treiden.pro',
          passwordHash: adminPasswordHash,
          displayName: 'Admin User',
          role: 'ADMIN',
        });
      }

      return Promise.resolve(null);
    });

    mockPrisma.user.update.mockImplementation(({ where, data }: { where: any; data: any }) =>
      Promise.resolve({ id: where.id, ...data }),
    );

    mockPrisma.eventLog.create.mockResolvedValue({ id: 'event-id' });

    mockPrisma.course.findUnique.mockResolvedValue({
      id: 'track-1',
      currentVersionId: 'cv-1',
      versions: [{ versionNumber: 1 }],
      currentVersion: {
        sections: [
          {
            id: 'section-1',
            modules: [
              {
                id: 'module-1',
                title: 'Module 1',
                orderIndex: 0,
                status: 'PUBLISHED',
              },
            ],
          },
        ],
      },
    });

    mockPrisma.section.findFirst.mockResolvedValue({ id: 'section-1' });
    mockPrisma.courseModule.findFirst.mockResolvedValue({ id: 'module-1', orderIndex: 0 });
    mockPrisma.courseModule.create.mockResolvedValue({
      id: 'module-2',
      title: 'Created module',
      orderIndex: 1,
      status: 'DRAFT',
      section: { courseVersion: { courseId: 'track-1' } },
    });

    mockPrisma.courseModule.update.mockResolvedValue({
      id: 'module-1',
      title: 'Module updated',
      orderIndex: 5,
      status: 'PUBLISHED',
      section: { courseVersion: { courseId: 'track-1' } },
    });

    mockPrisma.courseModule.updateMany.mockResolvedValue({ count: 1 });

    mockPrisma.lesson.findMany.mockResolvedValue([
      {
        id: 'lesson-1',
        moduleId: 'module-1',
        title: 'Lesson 1',
        slug: 'lesson-1',
        markdownBody: 'Body',
        status: 'DRAFT',
        orderIndex: 0,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    mockPrisma.lesson.findFirst.mockResolvedValue({ id: 'lesson-1', orderIndex: 0 });
    mockPrisma.lesson.create.mockResolvedValue({
      id: 'lesson-2',
      moduleId: 'module-1',
      title: 'New Lesson',
      slug: 'new-lesson',
      markdownBody: '',
      status: 'DRAFT',
      orderIndex: 1,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      moduleId: 'module-1',
      title: 'Lesson 1',
      slug: 'lesson-1',
      markdownBody: 'Body',
      status: 'DRAFT',
      autosaveVersion: 2,
      orderIndex: 0,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockPrisma.lesson.update.mockResolvedValue({
      id: 'lesson-1',
      moduleId: 'module-1',
      title: 'Lesson 1',
      slug: 'lesson-1',
      markdownBody: 'Updated body',
      status: 'PUBLISHED',
      autosaveVersion: 3,
      orderIndex: 0,
      updatedAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    mockPrisma.lesson.updateMany.mockResolvedValue({ count: 1 });

    mockPrisma.lessonVersion.create.mockResolvedValue({ id: 'lv-new' });
    mockPrisma.lessonVersion.findMany.mockResolvedValue([
      {
        id: 'lv-1',
        lessonId: 'lesson-1',
        version: 1,
        markdownBody: 'v1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        createdBy: 'admin-1',
      },
    ]);

    mockPrisma.lessonVersion.findFirst.mockResolvedValue({
      id: 'lv-1',
      lessonId: 'lesson-1',
      version: 1,
      markdownBody: 'restored version',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: 'admin-1',
    });

    mockPrisma.lessonProgress.count.mockResolvedValue(1);
    mockPrisma.lessonProgress.findMany.mockResolvedValue([{ lessonId: 'lesson-1' }]);
    mockPrisma.lessonProgress.upsert.mockResolvedValue({ id: 'lp-1' });

    mockPrisma.lesson.count.mockResolvedValue(4);
    mockPrisma.test.count.mockResolvedValue(3);
    mockPrisma.testAttempt.findMany.mockResolvedValue([{ testId: 't1' }]);
    mockPrisma.certificate.count.mockResolvedValue(0);

    mockPrisma.$transaction.mockImplementation(async (input: any) => {
      if (typeof input === 'function') {
        return input({
          lesson: { update: mockPrisma.lesson.update },
          lessonVersion: { create: mockPrisma.lessonVersion.create },
        });
      }

      if (Array.isArray(input)) {
        await Promise.all(input);
      }

      return undefined;
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tracks/:trackId/modules -> 200 for USER', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .get('/api/tracks/track-1/modules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([
      {
        id: 'module-1',
        trackId: 'track-1',
        title: 'Module 1',
        position: 0,
        status: 'published',
      },
    ]);
  });

  it('POST /api/tracks/:trackId/modules -> 403 for USER', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    await request(app.getHttpServer())
      .post('/api/tracks/track-1/modules')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No rights' })
      .expect(403);
  });

  it('POST /api/tracks/:trackId/modules -> 201 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/tracks/track-1/modules')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Created module', position: 1 })
      .expect(201);

    expect(res.body).toEqual({
      id: 'module-2',
      trackId: 'track-1',
      title: 'Created module',
      position: 1,
      status: 'draft',
    });
  });

  it('PATCH /api/modules/:moduleId -> 200 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .patch('/api/modules/module-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Module updated', position: 5, status: 'published' })
      .expect(200);

    expect(res.body).toEqual({
      id: 'module-1',
      trackId: 'track-1',
      title: 'Module updated',
      position: 5,
      status: 'published',
    });
  });

  it('GET /api/modules/:moduleId/lessons -> 200', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .get('/api/modules/module-1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body[0]).toMatchObject({
      id: 'lesson-1',
      moduleId: 'module-1',
      title: 'Lesson 1',
    });
  });

  it('POST /api/modules/:moduleId/lessons -> 201 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/modules/module-1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Lesson', slug: 'new-lesson', markdownBody: '', orderIndex: 1 })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 'lesson-2',
      moduleId: 'module-1',
      title: 'New Lesson',
      slug: 'new-lesson',
      status: 'draft',
    });
  });

  it('GET /api/lessons/:lessonId -> 200', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .get('/api/lessons/lesson-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'lesson-1',
      title: 'Lesson 1',
      slug: 'lesson-1',
    });
  });

  it('POST /api/lessons/:lessonId/publish -> 200 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/lessons/lesson-1/publish')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('published');
  });

  it('POST /api/lessons/:lessonId/autosave -> 200 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/lessons/lesson-1/autosave')
      .set('Authorization', `Bearer ${token}`)
      .send({ markdownBody: 'Draft text' })
      .expect(200);

    expect(res.body).toEqual({
      version: 3,
      updatedAt: '2026-01-01T01:00:00.000Z',
    });
  });

  it('GET /api/lessons/:lessonId/versions -> 200', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .get('/api/lessons/lesson-1/versions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([
      {
        id: 'lv-1',
        lessonId: 'lesson-1',
        version: 1,
        markdownBody: 'v1',
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'admin-1',
      },
    ]);
  });

  it('POST /api/lessons/:lessonId/restore/:versionId -> 200 for ADMIN', async () => {
    const token = await login('admin@treiden.pro', 'AdminPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/lessons/lesson-1/restore/lv-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'lesson-1',
      status: 'draft',
    });
  });

  it('GET /api/progress/summary -> 200', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .get('/api/progress/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      percent: 25,
      testsCompleted: 1,
      testsTotal: 3,
      certificatesStatus: 'not_issued',
    });
  });

  it('POST /api/progress/lessons/:lessonId/complete -> 200', async () => {
    const token = await login('existing@treiden.pro', 'StrongPass123!');

    const res = await request(app.getHttpServer())
      .post('/api/progress/lessons/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({ success: true });
  });
});
