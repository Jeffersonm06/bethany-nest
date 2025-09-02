import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ReturnUserDto } from './dto/return-user.dto';

@Injectable()
export class UserService {
  private readonly path = 'users';

  constructor(private readonly firebaseService: FirebaseService) { }

  async create(user: CreateUserDto) {
    if (!user.accessType) {
      user.accessType = 1; // valor padrão
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = { ...user, password: hashedPassword };
    if (user.email == "" || user.password == "" || user.username == "") {
      throw new BadRequestException("Dados incompletos!")
    }
    return this.firebaseService.create<CreateUserDto>(this.path, newUser);
  }

  async findAll() {
    return this.firebaseService.findAll<User>(this.path);
  }

  // Buscar um
  async findOne(id: string): Promise<User | undefined> {
    const user = await this.firebaseService.findOne(this.path, id);
    return (user ? (user as User) : undefined);
  }

  // Atualizar usuário (re-hash se mudar a senha)
  async update(id: string, updates: Partial<User>) {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    return this.firebaseService.update(this.path, id, updates);
  }

  // Remover usuário
  async delete(id: string) {
    return this.firebaseService.delete(this.path, id);
  }

  // Validar login
  async findUserByEmail(email: string) {
    const users = await this.findAll();
    const user = Object.values(users).find((u) => u.email === email);
    if (!user) throw new NotFoundException("Email não encontrado");
    return user;
  }

}