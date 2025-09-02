import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private readonly firebase: typeof admin) {}

  private db() {
    return this.firebase.database();
  }

  async create<T>(path: string, data: T): Promise<{ id: string; data: T }> {
    const ref = this.db().ref(path).push();
    await ref.set(data);
    return { id: ref.key!, data };
  }

  async findOne<T>(path: string, id: string): Promise<(T & { id: string }) | null> {
    const snapshot = await this.db().ref(`${path}/${id}`).once('value');
    if (!snapshot.exists()) return null;
    return { id, ...snapshot.val() } as T & { id: string };
  }

  async findAll<T>(path: string): Promise<(T & { id: string })[]> {
    const snapshot = await this.db().ref(path).once('value');
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, T>;
    return Object.entries(data).map(([id, value]) => ({ id, ...value }));
  }

  async update<T>(path: string, id: string, data: Partial<T>): Promise<Partial<T> & { id: string }> {
    await this.db().ref(`${path}/${id}`).update(data);
    return { id, ...data };
  }

  async delete(path: string, id: string): Promise<{ success: boolean; id: string }> {
    await this.db().ref(`${path}/${id}`).remove();
    return { success: true, id };
  }
}
