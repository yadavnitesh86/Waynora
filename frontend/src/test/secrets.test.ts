import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Standing secret-leakage guards (TM-01 from plan 01-02, AUTH-06).
 *
 * These walk `src/` on disk rather than importing it, so they hold for every
 * later phase: an executor cannot add a secret-shaped env read or a
 * server-only import without failing this suite.
 *
 * Rationale for the helper: Node's built-in `fs.readdirSync` with a manual
 * recursion is used instead of `glob`/`tinyglobby` because the pattern needed
 * here is a simple recursive walk — adding a dependency for it would
 * contradict the minimal-dependency decision (CONTEXT D-02). `fs.readdirSync`
 * with `recursive: true` only populates `Dirent.parentPath` from Node 20.12,
 * so the recursion is explicit rather than relying on Dirent path metadata.
 *
 * `import.meta.url` is read directly rather than through
 * `new URL(..., import.meta.url)`, which Vite rewrites into an asset URL and
 * which therefore does not resolve to a `file:` URL under vitest.
 */

const SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The only two `VITE_*` keys the browser is allowed to see (D-03). */
const ALLOWED_ENV_KEYS = new Set([
  "VITE_API_BASE_URL",
  "VITE_CONVEX_URL",
]);

/** Keys that are not `VITE_`-prefixed but are funneled through env.ts. */
const ALLOWED_NON_VITE_KEYS = new Set(["DEV"]);

const FORBIDDEN_LITERALS = [
  "CONVEX_DEPLOY_KEY",
  "JWT_PRIVATE_KEY",
  "JWT_PRIVATE",
];

const SECRET_ENV_PATTERN =
  /import\.meta\.env\.[A-Z0-9_]*(?:SECRET|KEY|TOKEN|PASSWORD|DEPLOY)[A-Z0-9_]*/;

const IMPORT_META_ENV_KEY = /import\.meta\.env\.([A-Za-z0-9_]+)/g;

const RELATIVE_CONVEX_IMPORT =
  /(?:from|import)\s*\(?\s*["'](\.[^"']*convex\/[^"']*)["']/g;

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Every shipped source file. Test files are excluded: they contain the
 *  forbidden literals on purpose, and they are never part of the bundle. */
function sourceFiles(): string[] {
  return walk(SRC_DIR).filter(
    (file) => !/\.(test|spec)\.(ts|tsx)$/.test(file),
  );
}

function read(file: string): string {
  return readFileSync(file, "utf8");
}

const FILES = sourceFiles();

describe("source tree is scannable", () => {
  it("finds the src/ tree", () => {
    expect(FILES.length).toBeGreaterThan(5);
  });
});

describe("no secret-shaped env reads (TM-01, AUTH-06)", () => {
  it("no source file reads a VITE_ secret/key/token/password/deploy key", () => {
    for (const file of FILES) {
      expect(SECRET_ENV_PATTERN.test(read(file)), file).toBe(false);
    }
  });

  it("no source file names a deployment or JWT private key", () => {
    for (const file of FILES) {
      const contents = read(file);
      for (const literal of FORBIDDEN_LITERALS) {
        expect(contents.includes(literal), `${file} contains ${literal}`).toBe(
          false,
        );
      }
    }
  });
});

describe("import.meta.env funnel", () => {
  it("is read only inside src/lib/env.ts", () => {
    const readers = FILES.filter((file) => read(file).includes("import.meta.env"));
    expect(readers).toEqual([join(SRC_DIR, "lib", "env.ts")]);
  });

  it("references only the two allowed VITE_ keys in env.ts", () => {
    const contents = read(join(SRC_DIR, "lib", "env.ts"));

    // Every VITE_-prefixed literal named anywhere in the module.
    const named = new Set(
      [...contents.matchAll(/\bVITE_[A-Z0-9_]+\b/g)].map((match) => match[0]),
    );
    expect([...named].sort()).toEqual([...ALLOWED_ENV_KEYS].sort());

    // And the only key read off the raw env object is the funneled DEV flag;
    // the VITE_ values themselves are reached through the validated schema.
    const readKeys = new Set(
      [...contents.matchAll(IMPORT_META_ENV_KEY)].map((match) => match[1] ?? ""),
    );
    for (const key of readKeys) {
      expect(
        ALLOWED_NON_VITE_KEYS.has(key) || ALLOWED_ENV_KEYS.has(key),
        `unexpected env key: ${key}`,
      ).toBe(true);
    }
  });
});

describe("no server-only convex imports from the client", () => {
  it("imports nothing from convex/ except the generated client API", () => {
    for (const file of FILES) {
      const contents = read(file);
      for (const match of contents.matchAll(RELATIVE_CONVEX_IMPORT)) {
        const specifier = match[1] ?? "";
        // convex/_generated/* is the generated client surface every Convex SPA
        // imports. Everything else under convex/ is server-only code.
        expect(
          specifier.includes("convex/_generated/"),
          `${file} imports ${specifier}`,
        ).toBe(true);
      }
    }
  });
});
