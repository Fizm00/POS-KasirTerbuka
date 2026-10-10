import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Table, type TableColumn } from "./Table";

interface SampleRow {
  id: string;
  name: string;
  price: number;
}

describe("Table", () => {
  const data: SampleRow[] = [
    { id: "1", name: "Kopi", price: 15000 },
    { id: "2", name: "Teh", price: 5000 },
  ];

  const columns: TableColumn<SampleRow>[] = [
    { key: "name", header: "Nama", sortable: true },
    { key: "price", header: "Harga", isNumeric: true, sortable: true },
  ];

  it("renders table with sortable headers and aria-sort", async () => {
    const handleSort = vi.fn();
    render(
      <Table<SampleRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        sortColumn="name"
        sortDirection="asc"
        onSort={handleSort}
      />
    );

    const nameTh = screen.getByRole("columnheader", { name: /Nama/i });
    expect(nameTh).toHaveAttribute("aria-sort", "ascending");

    const sortNameBtn = screen.getByRole("button", { name: "Urutkan Nama" });
    await userEvent.click(sortNameBtn);
    expect(handleSort).toHaveBeenCalledWith("name");
  });

  it("renders descending and none aria-sort appropriately", () => {
    const { rerender } = render(
      <Table<SampleRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        sortColumn="price"
        sortDirection="desc"
        onSort={() => {}}
      />
    );

    const priceTh = screen.getByRole("columnheader", { name: /Harga/i });
    expect(priceTh).toHaveAttribute("aria-sort", "descending");

    rerender(
      <Table<SampleRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        sortColumn={undefined}
        sortDirection={null}
        onSort={() => {}}
      />
    );

    expect(screen.getByRole("columnheader", { name: /Harga/i })).toHaveAttribute(
      "aria-sort",
      "none"
    );
  });

  it("renders empty state message when data is empty", () => {
    render(
      <Table<SampleRow>
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyMessage="Belum ada data sampel"
      />
    );

    expect(screen.getByText("Belum ada data sampel")).toBeInTheDocument();
  });
});
