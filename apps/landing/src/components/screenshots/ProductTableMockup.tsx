export function ProductTableMockup() {
  const products = [
    {
      name: "Kopi Susu Gula Aren",
      sku: "KOP-001",
      cat: "Minuman",
      price: "Rp 15.000",
      cost: "Rp 8.000",
      stock: "48",
    },
    {
      name: "Nasi Goreng Spesial",
      sku: "NAS-002",
      cat: "Makanan",
      price: "Rp 22.000",
      cost: "Rp 12.000",
      stock: "15",
    },
    {
      name: "Teh Botol Sosro",
      sku: "TEH-003",
      cat: "Minuman",
      price: "Rp 6.000",
      cost: "Rp 3.500",
      stock: "8 (menipis)",
    },
    {
      name: "Roti Bakar Cokelat",
      sku: "ROT-004",
      cat: "Makanan",
      price: "Rp 18.000",
      cost: "Rp 9.000",
      stock: "22",
    },
  ];

  return (
    <div className="border border-[#E6E3DA] rounded-[2px] bg-white p-4 font-sans text-xs select-none">
      <div className="flex justify-between items-center pb-3 border-b border-[#E6E3DA]">
        <div className="font-semibold text-sm text-[#1A1A18]">Daftar Produk & Stok</div>
        <div className="h-6 px-2.5 bg-[#1F6F5C] text-white rounded text-[11px] font-medium flex items-center">
          + Tambah Produk
        </div>
      </div>

      <div className="w-full overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E6E3DA] text-[11px] text-[#5F5E58]">
              <th className="py-2 pr-2 font-medium">Nama Produk</th>
              <th className="py-2 px-2 font-medium">SKU</th>
              <th className="py-2 px-2 font-medium">Kategori</th>
              <th className="py-2 px-2 text-right font-medium">Harga</th>
              <th className="py-2 pl-2 text-right font-medium">Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E3DA]/60 text-[11px]">
            {products.map((p) => (
              <tr key={p.sku} className="hover:bg-[#FBFAF7]">
                <td className="py-2 pr-2 font-medium text-[#1A1A18]">{p.name}</td>
                <td className="py-2 px-2 text-[#5F5E58] font-mono">{p.sku}</td>
                <td className="py-2 px-2 text-[#5F5E58]">{p.cat}</td>
                <td className="py-2 px-2 text-right tabular-nums text-[#1A1A18]">{p.price}</td>
                <td
                  className={`py-2 pl-2 text-right tabular-nums font-medium ${p.stock.includes("menipis") ? "text-[#B08A57]" : "text-[#1F6F5C]"}`}
                >
                  {p.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
