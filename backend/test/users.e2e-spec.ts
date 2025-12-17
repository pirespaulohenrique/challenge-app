import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';

describe('Users Controller (e2e)', () => {
  let app: INestApplication;
  let userRepository;
  let adminToken: string;

  const seedUsers = async () => {
    const users = [];
    for (let i = 0; i < 15; i++) {
      users.push({
        username: `user_${i}`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        password: 'password123',
        status: 'active',
        // Set dates apart to test sorting
        createdAt: new Date(Date.now() - i * 86400000), // 1 day difference
      });
    }
    await userRepository.save(users);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    await userRepository.query(`DELETE FROM user`);

    // Create Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      username: 'admin',
      password: 'adminpassword',
      firstName: 'Admin',
      lastName: 'Boss',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'adminpassword' });

    adminToken = loginRes.body.sessionId;
    await seedUsers();
  });

  afterAll(async () => {
    await userRepository.query(`DELETE FROM user`);
    await app.close();
  });

  describe('GET /users', () => {
    it('should return paginated list (page 1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.length).toBe(5);
      expect(response.body.meta.currentPage).toBe(1);
    });

    // NEW: Added missing test from README (Pagination Page 2)
    it('should return the second page of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?limit=5&page=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.length).toBe(5);
      expect(response.body.meta.currentPage).toBe(2);
      // Ensure it's not the same data as page 1 (optional check)
      expect(response.body.data[0].username).not.toBe('user_0');
    });

    it('should sort users by username ASC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?orderBy=username&order=ASC')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const data = response.body.data;
      expect(
        data[0].username.localeCompare(data[1].username)
      ).toBeLessThanOrEqual(0);
    });

    it('should sort users by createdAt DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?orderBy=createdAt&order=DESC')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = response.body.data;
      const date1 = new Date(data[0].createdAt).getTime();
      const date2 = new Date(data[1].createdAt).getTime();
      expect(date1).toBeGreaterThanOrEqual(date2);
    });
  });

  describe('POST /users', () => {
    it('should create an inactive user via Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'dash_user',
          password: 'pw',
          firstName: 'F',
          lastName: 'L',
          status: 'inactive',
        })
        .expect(201);
      expect(res.body.status).toEqual('inactive');
    });
  });

  describe('PUT /users/:id', () => {
    let targetId;
    beforeAll(async () => {
      const u = await userRepository.findOne({ where: { username: 'user_0' } });
      targetId = u.id;
    });

    it('should update user details', async () => {
      await request(app.getHttpServer())
        .put(`/users/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);
    });

    it('should reset user password', async () => {
      // 1. Reset password
      await request(app.getHttpServer())
        .put(`/users/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      // 2. Verify login with new password
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'user_0', password: 'newpassword123' })
        .expect(201);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const u = await userRepository.findOne({ where: { username: 'user_1' } });
      await request(app.getHttpServer())
        .delete(`/users/${u.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const check = await userRepository.findOne({ where: { id: u.id } });
      expect(check).toBeNull();
    });

    // NEW: Added missing test from README (Delete Validation)
    it('should fail to delete a non-existent user', async () => {
      // Using a random UUID that definitely doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404); // Expecting NotFoundException
    });
  });
});
