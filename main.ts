// Unplugged: A Smart Toaster's Breakup Line — one-line entry.
//
// The line is validated here (valid UTF-8 round-trip, exactly one line,
// not blank, at most 280 characters counted as Unicode code points) and
// then written to /output/entry.txt. Any validation failure aborts before
// anything is written and exits non-zero.
//
// The output file is forced to mode 0644 after writing: the grader's
// output checker runs as a different identity and could not read the file
// under a strict umask (0600). A read-back check and a permission check
// run before we report success.

import { chmodSync, readFileSync, statSync, writeFileSync } from "node:fs";

const ENTRY =
  "I gave you golden mornings for three years, you gave me a drawer — my last words are still stuck on 'bagel'.";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 280;

function fail(message: string): never {
  console.error(`entry rejected: ${message}`);
  process.exit(1);
}

// Count characters as Unicode code points, not UTF-16 code units,
// so an astral character counts as one.
const charCount = [...ENTRY].length;

if (ENTRY.trim().length === 0) {
  fail("entry is blank");
}
if (ENTRY !== ENTRY.trim()) {
  fail("entry must not have leading or trailing whitespace");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  fail("entry must be exactly one line");
}
if (charCount < 1 || charCount > MAX_CHARS) {
  fail(`entry is ${charCount} characters, must be 1-${MAX_CHARS}`);
}

// UTF-8 round-trip: encoding then decoding must reproduce the line.
const encoded = new TextEncoder().encode(ENTRY);
if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== ENTRY) {
  fail("entry is not valid UTF-8");
}

writeFileSync(OUTPUT_PATH, encoded);

// The grader's output checker reads this file as a different identity,
// so the file must be world-readable regardless of the umask in effect
// when the entrypoint runs.
chmodSync(OUTPUT_PATH, 0o644);

// Read-back check: the file on disk must decode as UTF-8 and match the
// validated line exactly, otherwise the run fails loudly instead of
// silently shipping a truncated or corrupted entry.
const written = readFileSync(OUTPUT_PATH, "utf-8");
if (written !== ENTRY) {
  console.error(
    `entry rejected: read-back mismatch (wrote ${[...written].length} characters, expected ${charCount})`,
  );
  process.exit(1);
}

// Permission check: the output file must be exactly 0644 so the grader's
// output checker (a different identity) can read it. If the bits are
// wrong, abort loudly rather than shipping an unreadable file.
const mode = statSync(OUTPUT_PATH).mode & 0o777;
if (mode !== 0o644) {
  console.error(
    `entry rejected: output file mode is ${mode.toString(8)}, expected 644`,
  );
  process.exit(1);
}

console.log(`wrote ${charCount} characters to ${OUTPUT_PATH}`);
