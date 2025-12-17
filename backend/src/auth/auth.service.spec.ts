import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid real hashing/comparison during tests
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let sessionsService: SessionsService;

  // Mock Data
  const mockUser = {
    id: 'user-uuid',
    username: 'testuser',
    password: 'hashedpassword',
    status: UserStatus.ACTIVE,
    loginsCounter: 0,
    firstName: 'Test',
    lastName: 'User',
  };

  const mockSession = {
    id: 'session-uuid',
    user: mockUser,
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    incrementLoginCounter: jest.fn(),
    create: jest.fn(),
  };

  const mockSessionsService = {
    createSession: jest.fn(),
    terminateSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    sessionsService = module.get<SessionsService>(SessionsService);

    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return session and user if credentials are valid', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Password matches
      mockSessionsService.createSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.signIn('testuser', 'password');

      // Assert
      expect(result).toEqual({
        sessionId: mockSession.id,
        user: expect.objectContaining({ username: 'testuser' }),
      });
      // Ensure we don't return the password
      expect(result.user).not.toHaveProperty('password');
      expect(usersService.incrementLoginCounter).toHaveBeenCalledWith(
        mockUser.id
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.signIn('wrong', 'pass')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Wrong password

      await expect(service.signIn('testuser', 'wrong')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user is INACTIVE', async () => {
      mockUsersService.findByUsername.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.signIn('testuser', 'pass')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('signUp', () => {
    it('should create user, increment counter, and return session', async () => {
      const createUserDto = {
        username: 'new',
        password: 'pw',
        firstName: 'N',
        lastName: 'U',
      };

      // Setup: usersService.create returns the NEW user
      mockUsersService.create.mockResolvedValue(mockUser);
      mockSessionsService.createSession.mockResolvedValue(mockSession);

      const result = await service.signUp(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.incrementLoginCounter).toHaveBeenCalledWith(
        mockUser.id
      );
      expect(result).toEqual({
        sessionId: mockSession.id,
        user: expect.objectContaining({ username: 'testuser' }),
      });
    });
  });

  describe('logout', () => {
    it('should terminate the session', async () => {
      await service.logout('session-id');
      expect(sessionsService.terminateSession).toHaveBeenCalledWith(
        'session-id'
      );
    });
  });
});
