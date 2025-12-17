import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async createSession(user: User): Promise<Session> {
    const session = this.sessionsRepository.create({ user: user });
    return this.sessionsRepository.save(session);
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    session.terminatedAt = new Date();
    await this.sessionsRepository.save(session);
  }
}