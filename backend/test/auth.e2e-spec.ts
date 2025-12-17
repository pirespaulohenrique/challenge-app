import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let userRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Enable DTO validation
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    await userRepository.query(`DELETE FROM user`); // Start clean
  });

  afterAll(async () => {
    await userRepository.query(`DELETE FROM user`);
    await app.close();
  });

  const validUser = {
    username: 'test_auth_user',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };

  let sessionCookie: string;

  // ==========================================
  // 1. REGISTRATION
  // ==========================================
  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toEqual(validUser.username);
    });

    it('should fail if username is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validUser, username: 'abc' })
        .expect(400);
    });

    it('should fail if password is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validUser, username: 'user_valid', password: '123' })
        .expect(400);
    });

    it('should fail if username is already taken', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(409); // Conflict
    });
  });

  // ==========================================
  // 2. LOGIN
  // ==========================================
  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: validUser.username, password: validUser.password })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      sessionCookie = response.body.sessionId;
    });

    it('should fail with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: validUser.username, password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'ghost', password: 'password123' })
        .expect(401);
    });

    it('should fail if user is inactive', async () => {
      // Create user manually
      const inactiveUser = await userRepository.save({
        username: 'inactive_user',
        password: 'password123', // Assuming manual save works, or use register + update
        firstName: 'Lazy',
        lastName: 'User',
        status: 'active',
      });
      // Force status update
      await userRepository.update(inactiveUser.id, { status: 'inactive' });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'inactive_user', password: 'password123' })
        .expect(401);
    });
  });

  // ==========================================
  // 3. LOGOUT
  // ==========================================
  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${sessionCookie}`)
        .expect(201);
    });
  });
});
