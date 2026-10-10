import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./DateRangePicker";

describe("DateRangePicker", () => {
  it("renders trigger button and quick preset buttons", () => {
    render(
      <DateRangePicker
        startDate="2026-10-10"
        endDate="2026-10-10"
        activePreset="today"
        onChange={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: /^Hari ini$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Kemarin$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^7 hari$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Bulan ini$/i })).toBeInTheDocument();
  });

  it("calls onChange when a preset button is clicked", async () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        startDate="2026-10-10"
        endDate="2026-10-10"
        activePreset="today"
        onChange={handleChange}
      />
    );

    const yesterdayBtn = screen.getByRole("button", { name: "Kemarin" });
    await userEvent.click(yesterdayBtn);

    expect(handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(String), "yesterday");

    const sevenDaysBtn = screen.getByRole("button", { name: "7 hari" });
    await userEvent.click(sevenDaysBtn);

    expect(handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(String), "7days");
  });

  it("opens modal dialog, validates start <= end, and applies range", async () => {
    const handleChange = vi.fn();
    render(<DateRangePicker startDate="2026-10-01" endDate="2026-10-10" onChange={handleChange} />);

    // Open popover by clicking the trigger
    const trigger = screen.getByRole("button", { name: /01\/10\/2026/i });
    await userEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Find custom date inputs
    const startInput = screen.getByLabelText(/Dari tanggal/i);
    const endInput = screen.getByLabelText(/Sampai tanggal/i);

    // Enter invalid range (start > end)
    await userEvent.clear(startInput);
    await userEvent.type(startInput, "2026-10-20");
    await userEvent.clear(endInput);
    await userEvent.type(endInput, "2026-10-10");

    expect(
      screen.getByText(/Tanggal mulai tidak boleh melebihi tanggal akhir/i)
    ).toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: /Terapkan rentang/i });
    expect(applyBtn).toBeDisabled();

    // Fix date range to be valid
    await userEvent.clear(startInput);
    await userEvent.type(startInput, "2026-10-05");

    expect(
      screen.queryByText(/Tanggal mulai tidak boleh melebihi tanggal akhir/i)
    ).not.toBeInTheDocument();
    expect(applyBtn).not.toBeDisabled();

    await userEvent.click(applyBtn);

    expect(handleChange).toHaveBeenCalledWith("2026-10-05", "2026-10-10", "custom");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets date range when reset button is clicked", async () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        startDate="2026-10-01"
        endDate="2026-10-10"
        allowEmpty
        onChange={handleChange}
      />
    );

    const resetBtn = screen.getByRole("button", { name: /Reset filter/i });
    await userEvent.click(resetBtn);

    expect(handleChange).toHaveBeenCalledWith("", "", undefined);
  });
});
