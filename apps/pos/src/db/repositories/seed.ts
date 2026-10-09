import { type Category, defaultSettings, PosDatabase, type Product, type User } from "../index";

export async function seedDatabase(database: PosDatabase): Promise<void> {
  // Clear any existing data
  await database.settings.clear();
  await database.users.clear();
  await database.categories.clear();
  await database.products.clear();
  await database.transactions.clear();
  await database.counters.clear();

  // 1. Settings
  await database.settings.put({
    ...defaultSettings,
    storeName: "Toko Berkah Bersama",
    address: "Jl. Mawar No. 12, Magelang",
    phone: "0812-3456-7890",
    receiptFooter: "Terima kasih, semoga berkah!",
  });

  // 2. Initial Admin User
  const adminUser: User = {
    id: crypto.randomUUID(),
    name: "Budi Santoso",
    role: "admin",
    pinHash: "sample-hash-admin",
    isActive: true,
  };
  const cashierUser: User = {
    id: crypto.randomUUID(),
    name: "Rina Marlina",
    role: "kasir",
    pinHash: "sample-hash-kasir",
    isActive: true,
  };
  await database.users.bulkAdd([adminUser, cashierUser]);

  // 3. Categories
  const catMakanan: Category = { id: crypto.randomUUID(), name: "Makanan" };
  const catMinuman: Category = { id: crypto.randomUUID(), name: "Minuman" };
  const catSnack: Category = { id: crypto.randomUUID(), name: "Snack" };
  const catSembako: Category = { id: crypto.randomUUID(), name: "Sembako" };
  await database.categories.bulkAdd([catMakanan, catMinuman, catSnack, catSembako]);

  // 4. Products (realistic Indonesian items)
  const products: Product[] = [
    {
      id: crypto.randomUUID(),
      name: "Kopi Susu Gula Aren",
      sku: "MIN-001",
      categoryId: catMinuman.id,
      price: 15000,
      cost: 8000,
      stock: 28,
      lowStockThreshold: 5,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Nasi Goreng Spesial",
      sku: "MAK-001",
      categoryId: catMakanan.id,
      price: 22000,
      cost: 12000,
      stock: 14,
      lowStockThreshold: 4,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Indomie Goreng Telur",
      sku: "MAK-002",
      categoryId: catMakanan.id,
      price: 12000,
      cost: 6500,
      stock: 25,
      lowStockThreshold: 5,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Teh Botol Sosro",
      sku: "MIN-002",
      categoryId: catMinuman.id,
      price: 6000,
      cost: 3500,
      stock: 40,
      lowStockThreshold: 10,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Aqua 600ml",
      sku: "MIN-003",
      categoryId: catMinuman.id,
      price: 4000,
      cost: 2500,
      stock: 50,
      lowStockThreshold: 12,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Kerupuk Kaleng",
      sku: "SNK-001",
      categoryId: catSnack.id,
      price: 2000,
      cost: 1000,
      stock: 35,
      lowStockThreshold: 5,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Minyak Goreng 1L",
      sku: "SMB-001",
      categoryId: catSembako.id,
      price: 18500,
      cost: 15500,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Beras Rojolele 5kg",
      sku: "SMB-002",
      categoryId: catSembako.id,
      price: 72000,
      cost: 64000,
      stock: 6,
      lowStockThreshold: 2,
      isActive: true,
    },
  ];

  await database.products.bulkAdd(products);
}
