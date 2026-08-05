import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  create(user: Partial<User>): Promise<User> {
    const entity = this.usersRepository.create(user);
    return this.usersRepository.save(entity);
  }

  count(): Promise<number> {
    return this.usersRepository.count();
  }

  createUser(user: Partial<User>): Promise<User>{
    const entity =this.usersRepository.create(user);
    return this.usersRepository.save(entity);


  }
   async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersRepository.find({ order: { username: 'ASC' } });
    return users.map(({ passwordHash, ...rest }) => rest);
  }
}
