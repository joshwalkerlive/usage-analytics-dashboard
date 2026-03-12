import { describe, it, expect } from "vitest";
import { parseFiles } from "../folder-picker-utils";
import { mockRawSession } from "../../test/fixtures";

function makeJsonFile(name: string, content: unknown): File {
  return new File([JSON.stringify(content)], name, { type: "application/json" });
}

describe("parseFiles", () => {
  it("parses valid session files and returns sessions + counts", async () => {
    const files = [
      makeJsonFile("a.json", [mockRawSession]),
      makeJsonFile("b.json", [{ ...mockRawSession, id: "session-002" }]),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(2);
    expect(result.fileCount).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it("counts files that fail to parse as skipped", async () => {
    const files = [
      makeJsonFile("good.json", [mockRawSession]),
      new File(["not json at all"], "bad.json"),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });

  it("returns zero sessions when all files are invalid", async () => {
    const files = [
      new File(["{}"], "wrong.json"),
      new File(["bad"], "corrupt.json"),
    ];
    const result = await parseFiles(files);
    expect(result.sessions).toHaveLength(0);
    expect(result.skipped).toBe(2);
  });

  it("handles an empty file list", async () => {
    const result = await parseFiles([]);
    expect(result.sessions).toHaveLength(0);
    expect(result.fileCount).toBe(0);
    expect(result.skipped).toBe(0);
  });
});
