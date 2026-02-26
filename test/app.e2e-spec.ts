import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('Frontend OpenAPI Contract (e2e)', () => {
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
    },
  };

  const mockRedis = {
    getClient: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

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

    const passwordHash = await bcrypt.hash('StrongPass123!', 10);

    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: any }) => {
      if (where.email === 'existing@treiden.pro') {
        return Promise.resolve({
          id: 'existing-user-id',
          email: 'existing@treiden.pro',
          passwordHash,
          displayName: 'Existing User',
          role: 'USER',
        });
      }

      if (where.id) {
        return Promise.resolve({
          id: where.id,
          email: 'existing@treiden.pro',
          passwordHash,
          displayName: 'Existing User',
          role: 'USER',
        });
      }

      return Promise.resolve(null);
    });

    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@treiden.pro',
      passwordHash,
      displayName: 'New User',
      role: 'USER',
    });

    mockPrisma.user.update.mockImplementation(({ where, data }: { where: any; data: any }) =>
      Promise.resolve({ id: where.id, ...data }),
    );

    mockPrisma.eventLog.create.mockResolvedValue({ id: 'event-id' });
    mockPrisma.course.findMany.mockResolvedValue([
      {
        id: 'course-1',
        title: 'Backend Fundamentals',
        status: 'PUBLISHED',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register -> 201 with User shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'new@treiden.pro',
        password: 'StrongPass123!',
      })
      .expect(201);

    expect(res.body).toEqual({
      id: 'new-user-id',
      email: 'new@treiden.pro',
      name: 'New User',
    });
  });

  it('POST /api/auth/register -> 409 when user exists', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Existing User',
        email: 'existing@treiden.pro',
        password: 'StrongPass123!',
      })
      .expect(409);
  });

  it('POST /api/auth/login -> 200 with tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'existing@treiden.pro',
        password: 'StrongPass123!',
      })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('GET /api/me -> 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /api/me -> 200 with token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'existing@treiden.pro',
        password: 'StrongPass123!',
      })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body).toEqual({
      id: expect.any(String),
      email: 'existing@treiden.pro',
      name: 'Existing User',
    });
  });

  it('GET /api/tracks -> 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/tracks').expect(401);
  });

  it('GET /api/tracks -> 200 with token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'existing@treiden.pro',
        password: 'StrongPass123!',
      })
      .expect(200);

    const tracks = await request(app.getHttpServer())
      .get('/api/tracks')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(tracks.body).toEqual([
      {
        id: 'course-1',
        label: 'Backend Fundamentals',
        status: 'active',
      },
    ]);
  });
});
