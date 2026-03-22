/**
 * Exports the test payload fixture as a standalone JSON file.
 * Usage: npx tsx scripts/export-test-payload.ts [output-path]
 */
import { mockPayloadV2 } from "../src/test/payload-fixture";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2] ?? resolve(__dirname, "../test-payload.json");
writeFileSync(outputPath, JSON.stringify(mockPayloadV2, null, 2));
console.log(`Test payload written to: ${outputPath}`);
