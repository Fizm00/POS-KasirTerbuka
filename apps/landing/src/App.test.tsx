import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("Landing Page — Full Desktop Experience", () => {
  it("renders header with wordmark, nav links, and action button", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: /^Kasir Terbuka$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fitur" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cara kerja" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FAQ" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "GitHub" }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero headline, subline, action links, and true facts line", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Kasir gratis untuk toko kecil, yang tetap jalan tanpa internet.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pasang di PC, tablet, atau HP. Datanya tetap di perangkat Anda.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Unduh aplikasi" }).length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getByRole("link", { name: "Lihat di GitHub" })).toBeInTheDocument();
    expect(screen.getByText("Gratis. Sumber terbuka. Tanpa akun.")).toBeInTheDocument();
  });

  it("renders the thermal receipt strip with real sale details", () => {
    render(<App />);

    expect(screen.getByText("Toko Berkah")).toBeInTheDocument();
    expect(screen.getByText("INV-20261009-0012")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("53.000")).toBeInTheDocument();
    expect(screen.getByText("Terima kasih")).toBeInTheDocument();
  });

  it("renders Statement section sentence", () => {
    render(<App />);

    expect(
      screen.getByText("Toko kecil tidak butuh langganan bulanan untuk mencatat penjualan.")
    ).toBeInTheDocument();
  });

  it("renders Features section with 4 alternating rows and mockups", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Kasir yang cepat" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stok dan produk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Laporan sederhana" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beberapa peran" })).toBeInTheDocument();
  });

  it("renders Local-First explainer and Thermal Printer sections", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Data Anda tinggal di perangkat Anda." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cetak struk di printer thermal." })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Daftar printer yang sudah diuji akan ditambahkan.")
    ).toBeInTheDocument();
  });

  it("renders Steps section and Download section panel", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Mulai dalam tiga langkah." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unduh Kasir Terbuka" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unduh untuk Windows" })).toBeInTheDocument();
    expect(screen.getByText("Segera hadir")).toBeInTheDocument();
  });

  it("renders Open Source section with 3 plain links and repo link", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Dibuat terbuka, supaya bisa diperiksa." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Laporkan masalah" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Berkontribusi" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Dokumentasi" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Repositori GitHub" })).toBeInTheDocument();
  });

  it("renders FAQ accordion with 7 questions, first question expanded by default, and toggles on click", () => {
    render(<App />);

    const q1 = "Apakah benar-benar gratis?";
    const q2 = "Di mana data saya disimpan?";
    const q3 = "Bagaimana kalau perangkat rusak atau hilang?";
    const q4 = "Apakah bisa dipakai di beberapa tablet sekaligus?";
    const q5 = "Printer apa yang didukung?";
    const q6 = "Apakah perlu internet?";
    const q7 = "Bagaimana cara mencadangkan data?";

    expect(screen.getByText(q1)).toBeInTheDocument();
    expect(screen.getByText(q2)).toBeInTheDocument();
    expect(screen.getByText(q3)).toBeInTheDocument();
    expect(screen.getByText(q4)).toBeInTheDocument();
    expect(screen.getByText(q5)).toBeInTheDocument();
    expect(screen.getByText(q6)).toBeInTheDocument();
    expect(screen.getByText(q7)).toBeInTheDocument();

    // First question is expanded by default
    expect(
      screen.getByText(/Ya, aplikasi ini gratis selamanya di bawah lisensi AGPL-3.0/i)
    ).toBeInTheDocument();

    // Click second question to expand it
    fireEvent.click(screen.getByText(q2));
    expect(
      screen.getByText(/Seluruh data toko, daftar produk, dan riwayat transaksi disimpan langsung/i)
    ).toBeInTheDocument();

    // Click fourth question to confirm honesty about non-sync limitation
    fireEvent.click(screen.getByText(q4));
    expect(
      screen.getByText(
        /Data transaksi tidak disinkronkan secara nirkabel antar-perangkat secara otomatis/i
      )
    ).toBeInTheDocument();
  });

  it("renders closing call-to-action headline, button, and footer on deep green", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Mulai catat penjualan hari ini." })
    ).toBeInTheDocument();
    expect(screen.getByText("Proyek sumber terbuka.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lisensi" })).toBeInTheDocument();
  });
});
