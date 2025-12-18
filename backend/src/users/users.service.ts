import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    try {
      return await this.usersRepository.save(newUser);
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        // Postgres error code for unique violation
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC'
  ) {
    const [data, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [orderBy]: order, // <--- This applies the dynamic sorting
      },
    });

    return {
      data,
      meta: {
        totalItems: total,
        currentPage: page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      select: [
        'id',
        'username',
        'firstName',
        'lastName',
        'password',
        'status',
        'loginsCounter',
      ],
    });
  }

  async findByName(firstName: string, lastName: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { firstName, lastName } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
      updateUserDto.password = hashedPassword;
    }
    await this.usersRepository.update(id, updateUserDto);
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async incrementLoginCounter(userId: string): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'loginsCounter', 1);
  }
}
