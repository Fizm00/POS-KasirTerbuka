import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import { DownloadSection } from "./components/DownloadSection";

describe("Landing Page — Full Desktop Experience", () => {
  it("renders header with wordmark, nav links, and action button", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: /^Kasir Terbuka$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Features" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FAQ" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "GitHub" }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero headline, subline, action links, and true facts line", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Free point-of-sale for small shops, that keeps running without internet.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Install on PC, tablet, or phone. Your data stays entirely on your device.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Download App" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "View on GitHub" })).toBeInTheDocument();
    expect(screen.getByText("Free forever. Open source. No account needed.")).toBeInTheDocument();
  });

  it("renders the thermal receipt strip with real sale details", () => {
    render(<App />);

    expect(screen.getByText("Toko Berkah")).toBeInTheDocument();
    expect(screen.getByText("INV-20261009-0012")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("53.000")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });

  it("renders Statement section sentence", () => {
    render(<App />);

    expect(
      screen.getByText("Small shops do not need a monthly subscription just to record sales.")
    ).toBeInTheDocument();
  });

  it("renders Features section with 4 alternating rows and mockups", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Fast at the counter" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Products & inventory" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Clear, honest reports" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Roles & PIN lock" })).toBeInTheDocument();
  });

  it("renders Local-First explainer and Thermal Printer sections", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Your data stays on your device." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Print receipts on thermal printers." })
    ).toBeInTheDocument();
    expect(
      screen.getByText("List of verified printer models will be added as tested.")
    ).toBeInTheDocument();
  });

  it("renders Steps section and Download section panel", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Get started in three steps." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Download Kasir Terbuka" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Download for (Windows|Linux|macOS|Android)$/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders DownloadSection with platform overrides", () => {
    const { unmount } = render(<DownloadSection initialPlatform="windows" />);
    expect(screen.getByRole("link", { name: "Download for Windows" })).toBeInTheDocument();
    unmount();

    render(<DownloadSection initialPlatform="android" />);
    expect(screen.getByRole("link", { name: "Download for Android" })).toBeInTheDocument();
  });

  it("renders Open Source section with 3 plain links and repo link", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Built in the open, so it can be verified." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report an issue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contribute" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Documentation" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "GitHub repository" })).toBeInTheDocument();
  });

  it("renders FAQ accordion with 7 questions, first question expanded by default, and toggles on click", () => {
    render(<App />);

    const q1 = "Is it really free?";
    const q2 = "Where is my data stored?";
    const q3 = "What if my device breaks or gets lost?";
    const q4 = "Can it be used on multiple devices simultaneously?";
    const q5 = "Which printers are supported?";
    const q6 = "Do I need an internet connection?";
    const q7 = "How do I back up my data?";

    expect(screen.getByText(q1)).toBeInTheDocument();
    expect(screen.getByText(q2)).toBeInTheDocument();
    expect(screen.getByText(q3)).toBeInTheDocument();
    expect(screen.getByText(q4)).toBeInTheDocument();
    expect(screen.getByText(q5)).toBeInTheDocument();
    expect(screen.getByText(q6)).toBeInTheDocument();
    expect(screen.getByText(q7)).toBeInTheDocument();

    // First question is expanded by default
    expect(
      screen.getByText(/Yes, this app is free forever under the AGPL-3.0 license/i)
    ).toBeInTheDocument();

    // Click second question to expand it
    fireEvent.click(screen.getByText(q2));
    expect(
      screen.getByText(/All store data, product lists, and transaction history are stored directly/i)
    ).toBeInTheDocument();

    // Click fourth question to confirm honesty about non-sync limitation
    fireEvent.click(screen.getByText(q4));
    expect(
      screen.getByText(
        /Transaction records do not synchronize wirelessly across multiple devices automatically/i
      )
    ).toBeInTheDocument();
  });

  it("renders closing call-to-action headline, button, and footer on deep green", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Start recording sales today." })
    ).toBeInTheDocument();
    expect(screen.getByText("Open-source project.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "License" })).toBeInTheDocument();
  });
});
