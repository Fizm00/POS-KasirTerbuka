import { type Category, db, PosDatabase } from "../schema";

export const categoriesRepo = {
  async getAll(database: PosDatabase = db): Promise<Category[]> {
    return database.categories.toArray();
  },

  async getById(id: string, database: PosDatabase = db): Promise<Category | undefined> {
    return database.categories.get(id);
  },

  async create(categoryData: Omit<Category, "id">, database: PosDatabase = db): Promise<Category> {
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
    };
    await database.categories.add(newCategory);
    return newCategory;
  },

  async update(
    id: string,
    updates: Partial<Omit<Category, "id">>,
    database: PosDatabase = db
  ): Promise<Category> {
    const existing = await database.categories.get(id);
    if (!existing) {
      throw new Error(`Category with ID ${id} not found`);
    }
    const updated: Category = { ...existing, ...updates };
    await database.categories.put(updated);
    return updated;
  },

  async delete(id: string, database: PosDatabase = db): Promise<void> {
    await database.categories.delete(id);
  },
};
