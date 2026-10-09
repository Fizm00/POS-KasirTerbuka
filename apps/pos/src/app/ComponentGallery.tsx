import React, { useState } from "react";
import {
  Button,
  Chip,
  Drawer,
  EmptyState,
  Input,
  Modal,
  SegmentedControl,
  Table,
  Toast,
} from "../components";
import { formatRupiah } from "../lib/money";
import { t } from "../i18n";

interface SampleItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

const sampleData: SampleItem[] = [
  { id: "1", name: "Kopi Susu Gula Aren", sku: "KOP-001", price: 15000, stock: 28 },
  { id: "2", name: "Nasi Goreng Spesial", sku: "NAS-002", price: 22000, stock: 14 },
  { id: "3", name: "Teh Manis Dingin", sku: "TEH-003", price: 5000, stock: 45 },
  { id: "4", name: "Roti Bakar Cokelat", sku: "ROT-004", price: 12000, stock: 8 },
];

export const ComponentGallery: React.FC = () => {
  const [moneyValue, setMoneyValue] = useState<number>(25000);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSuccessToastOpen, setIsSuccessToastOpen] = useState<boolean>(false);
  const [isErrorToastOpen, setIsErrorToastOpen] = useState<boolean>(false);
  const [showEmptyTable, setShowEmptyTable] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const tableColumns = [
    { key: "name", header: "Nama produk" },
    { key: "sku", header: "SKU" },
    {
      key: "price",
      header: "Harga jual",
      isNumeric: true,
      render: (item: SampleItem) => formatRupiah(item.price),
    },
    {
      key: "stock",
      header: "Stok",
      isNumeric: true,
      render: (item: SampleItem) => (
        <span className={item.stock <= 10 ? "text-[var(--warning)] font-semibold" : ""}>
          {item.stock}
        </span>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6 md:p-12 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-[var(--border)] pb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("devGallery.title")}</h1>
        <p className="text-base text-[var(--text-muted)]">{t("devGallery.subtitle")}</p>
      </header>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.buttons")}</h2>
        <div className="flex flex-wrap gap-4 items-center bg-[var(--surface)] p-6 rounded-[var(--radius-control)] border border-[var(--border)]">
          <Button variant="primary">{t("devGallery.primary")}</Button>
          <Button variant="secondary">{t("devGallery.secondary")}</Button>
          <Button variant="tertiary">{t("devGallery.tertiary")}</Button>
          <Button variant="destructive">{t("devGallery.destructive")}</Button>
          <Button variant="primary" size="large">
            {t("devGallery.payButton")}
          </Button>
          <Button variant="primary" isLoading>
            {t("devGallery.loadingButton")}
          </Button>
          <Button variant="primary" disabled>
            {t("devGallery.disabledButton")}
          </Button>
        </div>
      </section>

      {/* 2. Inputs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.inputs")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--surface)] p-6 rounded-[var(--radius-control)] border border-[var(--border)]">
          <Input
            label={t("devGallery.inputLabel")}
            helperText={t("devGallery.inputHelper")}
            defaultValue="Kopi Susu Gula Aren"
          />

          <Input
            label={t("devGallery.inputLabel")}
            error={t("devGallery.inputError")}
            defaultValue=""
          />

          <Input
            label={t("devGallery.moneyLabel")}
            helperText={t("devGallery.moneyHelper")}
            isMoney
            value={moneyValue}
            onMoneyChange={(val) => setMoneyValue(val)}
          />

          <Input
            label="Kode SKU (Nonaktif)"
            defaultValue="SKU-99281"
            disabled
            helperText="SKU dibuat otomatis oleh sistem."
          />
        </div>
      </section>

      {/* 3. Chips & Segmented Controls */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.segmented")}</h2>
        <div className="space-y-6 bg-[var(--surface)] p-6 rounded-[var(--radius-control)] border border-[var(--border)]">
          <div className="space-y-2">
            <span className="text-sm font-medium text-[var(--text-muted)] block">
              Chip Kategori
            </span>
            <div className="flex flex-wrap gap-2">
              <Chip
                label="Semua"
                count={48}
                isSelected={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
              />
              <Chip
                label="Makanan"
                count={24}
                isSelected={selectedCategory === "food"}
                onClick={() => setSelectedCategory("food")}
              />
              <Chip
                label="Minuman"
                count={16}
                isSelected={selectedCategory === "drinks"}
                onClick={() => setSelectedCategory("drinks")}
              />
              <Chip
                label="Snack"
                count={8}
                isSelected={selectedCategory === "snacks"}
                onClick={() => setSelectedCategory("snacks")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-[var(--text-muted)] block">
              Segmented Control (Metode Pembayaran)
            </span>
            <SegmentedControl
              options={[
                { value: "cash", label: "Tunai" },
                { value: "qris", label: "QRIS" },
                { value: "transfer", label: "Transfer" },
              ]}
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
            />
          </div>
        </div>
      </section>

      {/* 4. Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("devGallery.tables")}</h2>
          <Button variant="tertiary" onClick={() => setShowEmptyTable((prev) => !prev)}>
            {showEmptyTable ? "Tampilkan Data" : "Tampilkan Kondisi Kosong"}
          </Button>
        </div>

        <Table
          columns={tableColumns}
          data={showEmptyTable ? [] : sampleData}
          keyExtractor={(item) => item.id}
          emptyMessage={t("devGallery.emptyTitle")}
          emptyActionLabel={t("devGallery.emptyAction")}
          onEmptyAction={() => setShowEmptyTable(false)}
          currentPage={currentPage}
          totalPages={showEmptyTable ? 1 : 5}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </section>

      {/* 5. Modals & Drawers */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.modals")}</h2>
        <div className="flex flex-wrap gap-4 bg-[var(--surface)] p-6 rounded-[var(--radius-control)] border border-[var(--border)]">
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Buka Modal
          </Button>
          <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
            Buka Drawer
          </Button>
        </div>

        {/* Modal Example */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t("devGallery.modalTitle")}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                {t("devGallery.disabledButton")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-base text-[var(--text-muted)]">{t("devGallery.modalContent")}</p>
            <div className="p-4 bg-[var(--bg)] rounded-[var(--radius-control)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-base font-medium">Total tagihan</span>
              <span className="text-2xl font-bold tabular-nums text-[var(--primary)]">
                {formatRupiah(47000)}
              </span>
            </div>
          </div>
        </Modal>

        {/* Drawer Example */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={t("devGallery.drawerTitle")}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
                {t("common.save")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">{t("devGallery.drawerContent")}</p>
            <Input label="Nama produk" defaultValue="" />
            <Input label="Kode SKU" defaultValue="" />
            <Input label="Harga jual" isMoney defaultValue={0} />
          </div>
        </Drawer>
      </section>

      {/* 6. Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.toasts")}</h2>
        <div className="flex flex-wrap gap-4 bg-[var(--surface)] p-6 rounded-[var(--radius-control)] border border-[var(--border)]">
          <Button variant="secondary" onClick={() => setIsSuccessToastOpen(true)}>
            Tampilkan Toast Sukses
          </Button>
          <Button variant="secondary" onClick={() => setIsErrorToastOpen(true)}>
            Tampilkan Toast Galat
          </Button>
        </div>

        <Toast
          isOpen={isSuccessToastOpen}
          variant="success"
          message={t("devGallery.toastSuccess")}
          onDismiss={() => setIsSuccessToastOpen(false)}
        />

        <Toast
          isOpen={isErrorToastOpen}
          variant="error"
          message={t("devGallery.toastError")}
          onDismiss={() => setIsErrorToastOpen(false)}
        />
      </section>

      {/* 7. Empty State */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("devGallery.emptyStates")}</h2>
        <EmptyState
          message={t("devGallery.emptyTitle")}
          actionLabel={t("devGallery.emptyAction")}
          onAction={() => alert("Tambah produk diklik")}
        />
      </section>
    </main>
  );
};
