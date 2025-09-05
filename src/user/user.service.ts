import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ReturnUserDto } from './dto/return-user.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private readonly path = 'users';
  private uploadDir = path.join(__dirname, '..', '..', 'uploads', 'profile-images');

  constructor(private readonly firebaseService: FirebaseService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

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

  async updateProfilePic(userId: string, image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException("Nenhuma imagem enviada");
    }

    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    if (user.image) {
      const oldPath = path.join(this.uploadDir, path.basename(user.image));
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath).catch(() => {
          // se der erro ao deletar, ignora pra não travar a request
        });
      }
    }

    const imagePath = await this.saveUserImage(image);

    return this.firebaseService.update(this.path, userId, { image: imagePath });
  }

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

  async saveUserImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    // Extensões permitidas
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException("Formato de imagem inválido");
    }

    // Nome único com UUID
    const filename = `${uuidv4()}${extension}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);

    return `/uploads/profile-images/${filename}`;
  }


}