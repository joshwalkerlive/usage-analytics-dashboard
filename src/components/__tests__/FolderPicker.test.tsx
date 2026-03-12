import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FolderPicker } from "@/components/FolderPicker";
import * as utils from "@/lib/folder-picker-utils";
import { allMockSessions } from "@/test/fixtures";

vi.mock("@/lib/folder-picker-utils", () => ({
  parseFiles: vi.fn(),
  collectJsonFiles: vi.fn(),
}));

const mockParseFiles = vi.mocked(utils.parseFiles);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FolderPicker", () => {
  it("renders the select folder button", () => {
    render(<FolderPicker onLoaded={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByRole("button", { name: /select folder/i })).toBeInTheDocument();
  });

  it("shows confirmation dialog after files are loaded", async () => {
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 3,
      skipped: 0,
    });
    render(<FolderPicker onLoaded={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByTestId("folder-input");
    const file = new File(['{"sessions":[]}'], "export.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/found/i)).toBeInTheDocument();
    });
  });

  it("defaults to merge mode", async () => {
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 1,
      skipped: 0,
    });
    render(<FolderPicker onLoaded={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByTestId("folder-input");
    const file = new File(['{}'], "export.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const mergeRadio = screen.getByDisplayValue("merge");
      expect(mergeRadio).toBeChecked();
    });
  });

  it("cancel button dismisses the dialog", async () => {
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 1,
      skipped: 0,
    });
    render(<FolderPicker onLoaded={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByTestId("folder-input");
    fireEvent.change(input, { target: { files: [new File(['{}'], "a.json")] } });

    await waitFor(() => screen.getByText(/found/i));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/found/i)).not.toBeInTheDocument();
  });

  it("merge mode calls onLoaded but not onReplace", async () => {
    const onLoaded = vi.fn();
    const onReplace = vi.fn();
    const onError = vi.fn();
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 1,
      skipped: 0,
    });
    render(<FolderPicker onLoaded={onLoaded} onError={onError} onReplace={onReplace} />);

    const input = screen.getByTestId("folder-input");
    fireEvent.change(input, { target: { files: [new File(['{}'], "a.json")] } });

    await waitFor(() => screen.getByText(/found/i));
    fireEvent.click(screen.getByRole("button", { name: /load sessions/i }));

    expect(onLoaded).toHaveBeenCalledWith(allMockSessions);
    expect(onReplace).not.toHaveBeenCalled();
  });

  it("replace mode calls onReplace then onLoaded", async () => {
    const onLoaded = vi.fn();
    const onReplace = vi.fn();
    const onError = vi.fn();
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 1,
      skipped: 0,
    });
    render(<FolderPicker onLoaded={onLoaded} onError={onError} onReplace={onReplace} />);

    const input = screen.getByTestId("folder-input");
    fireEvent.change(input, { target: { files: [new File(['{}'], "a.json")] } });

    await waitFor(() => screen.getByText(/found/i));
    fireEvent.click(screen.getByDisplayValue("replace"));
    fireEvent.click(screen.getByRole("button", { name: /load sessions/i }));

    expect(onReplace).toHaveBeenCalled();
    expect(onLoaded).toHaveBeenCalledWith(allMockSessions);
  });

  it("calls onError when no JSON files found", async () => {
    const onError = vi.fn();
    render(<FolderPicker onLoaded={vi.fn()} onError={onError} />);

    const input = screen.getByTestId("folder-input");
    fireEvent.change(input, { target: { files: [new File(['data'], "image.png")] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("No JSON files found in that folder");
    });
  });

  it("shows skipped count in confirmation dialog when skipped > 0", async () => {
    mockParseFiles.mockResolvedValue({
      sessions: allMockSessions,
      fileCount: 3,
      skipped: 1,
    });
    render(<FolderPicker onLoaded={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByTestId("folder-input");
    const file = new File(['{}'], "a.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/\(1 skipped\)/i)).toBeInTheDocument();
    });
  });

  it("calls onError when all sessions are invalid", async () => {
    const onError = vi.fn();
    mockParseFiles.mockResolvedValue({
      sessions: [],
      fileCount: 2,
      skipped: 2,
    });
    render(<FolderPicker onLoaded={vi.fn()} onError={onError} />);

    const input = screen.getByTestId("folder-input");
    fireEvent.change(input, { target: { files: [new File(['{}'], "a.json"), new File(['{}'], "b.json")] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("No valid Claude sessions found"));
    });
  });
});
