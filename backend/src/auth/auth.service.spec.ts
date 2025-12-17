import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { UserStatus } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService
  ) {}

  async signIn(
    username: string,
    pass: string
  ): Promise<{ sessionId: string; user: any }> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User is inactive and cannot log in.');
    }

    await this.usersService.incrementLoginCounter(user.id);
    const session = await this.sessionsService.createSession(user);
    const { password, ...result } = user;

    return { sessionId: session.id, user: result };
  }

  async signUp(createUserDto: any): Promise<{ sessionId: string; user: any }> {
    // 1. Create the user
    const newUser = await this.usersService.create(createUserDto);

    // FIX: Increment login counter immediately (Starts at 1)
    await this.usersService.incrementLoginCounter(newUser.id);
    // Update the local object so the frontend sees '1' immediately
    newUser.loginsCounter = 1;

    // 2. Create the session
    const session = await this.sessionsService.createSession(newUser);

    const { password, ...result } = newUser;
    return { sessionId: session.id, user: result };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionsService.terminateSession(sessionId);
  }
}
