import { db, PosDatabase, type User } from "../schema";

export class LastAdminProtectionError extends Error {
  constructor(message = "Admin aktif terakhir tidak dapat dinonaktifkan atau diubah perannya.") {
    super(message);
    this.name = "LastAdminProtectionError";
  }
}

export const usersRepo = {
  async getUsers(database: PosDatabase = db): Promise<User[]> {
    return database.users.toArray();
  },

  async getUserById(id: string, database: PosDatabase = db): Promise<User | undefined> {
    return database.users.get(id);
  },

  async countActiveAdmins(database: PosDatabase = db): Promise<number> {
    return database.users.filter((u) => u.role === "admin" && u.isActive).count();
  },

  async createUser(userData: Omit<User, "id">, database: PosDatabase = db): Promise<User> {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
    };
    await database.users.add(newUser);
    return newUser;
  },

  async updateUser(
    id: string,
    updates: Partial<Omit<User, "id">>,
    database: PosDatabase = db
  ): Promise<User> {
    const existing = await database.users.get(id);
    if (!existing) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Check last-admin protection if this user is currently an active admin
    if (existing.role === "admin" && existing.isActive) {
      const isDeactivating = updates.isActive === false;
      const isDemoting = updates.role !== undefined && updates.role !== "admin";

      if (isDeactivating || isDemoting) {
        const activeAdmins = await this.countActiveAdmins(database);
        if (activeAdmins <= 1) {
          throw new LastAdminProtectionError();
        }
      }
    }

    const updated: User = { ...existing, ...updates };
    await database.users.put(updated);
    return updated;
  },

  async toggleActive(id: string, database: PosDatabase = db): Promise<User> {
    const existing = await database.users.get(id);
    if (!existing) {
      throw new Error(`User with ID ${id} not found`);
    }
    return this.updateUser(id, { isActive: !existing.isActive }, database);
  },

  async resetPin(id: string, pinHash: string, database: PosDatabase = db): Promise<User> {
    return this.updateUser(id, { pinHash }, database);
  },

  async countAdmins(database: PosDatabase = db): Promise<number> {
    return this.countActiveAdmins(database);
  },
};
