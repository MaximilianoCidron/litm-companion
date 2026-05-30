/**
 * Storage-path helper tests. Run with:
 *
 *   node --test --experimental-strip-types src/shared/lib/__tests__/storage-paths.test.ts
 *
 * Uses Node's built-in test runner + assert. Zero deps.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseStoragePathFromUrl,
  parseCharacterIdFromAvatarPath,
  formatBytes,
} from "../storage-paths";

describe("parseStoragePathFromUrl", () => {
  it("extracts path from canonical Firebase Storage URL", () => {
    const url =
      "https://firebasestorage.googleapis.com/v0/b/codex-app.firebasestorage.app/o/users%2Fabc%2Fcharacters%2Fxyz%2Favatar.jpg?alt=media&token=deadbeef";
    assert.equal(
      parseStoragePathFromUrl(url),
      "users/abc/characters/xyz/avatar.jpg",
    );
  });

  it("returns null for non-Firebase URLs", () => {
    assert.equal(parseStoragePathFromUrl("https://example.com/foo"), null);
  });

  it("returns null for malformed URLs", () => {
    assert.equal(parseStoragePathFromUrl("not a url"), null);
  });

  it("returns null when path shape doesn't match /v0/b/.../o/...", () => {
    assert.equal(
      parseStoragePathFromUrl("https://firebasestorage.googleapis.com/foo"),
      null,
    );
  });

  it("decodes percent-encoded characters", () => {
    const url =
      "https://firebasestorage.googleapis.com/v0/b/x/o/users%2Fa%20b%2Ffile.jpg?alt=media";
    assert.equal(parseStoragePathFromUrl(url), "users/a b/file.jpg");
  });
});

describe("parseCharacterIdFromAvatarPath", () => {
  it("extracts characterId from canonical avatar.jpg path", () => {
    assert.equal(
      parseCharacterIdFromAvatarPath("users/abc/characters/xyz/avatar.jpg"),
      "xyz",
    );
  });

  it("extracts characterId from avatar-thumb.jpg path", () => {
    assert.equal(
      parseCharacterIdFromAvatarPath(
        "users/abc/characters/xyz/avatar-thumb.jpg",
      ),
      "xyz",
    );
  });

  it("tolerates extension drift (legacy avatar.png)", () => {
    assert.equal(
      parseCharacterIdFromAvatarPath("users/abc/characters/xyz/avatar.png"),
      "xyz",
    );
  });

  it("returns null for non-avatar filenames under the character folder", () => {
    assert.equal(
      parseCharacterIdFromAvatarPath("users/abc/characters/xyz/portrait.jpg"),
      null,
    );
  });

  it("returns null for nested non-avatar paths", () => {
    assert.equal(
      parseCharacterIdFromAvatarPath("users/abc/characters/xyz/other/foo.jpg"),
      null,
    );
  });
});

describe("formatBytes", () => {
  it("renders 0 as '0 B'", () => {
    assert.equal(formatBytes(0), "0 B");
  });
  it("renders 512 B", () => {
    assert.equal(formatBytes(512), "512 B");
  });
  it("renders 1.5 KB", () => {
    assert.equal(formatBytes(1536), "1.5 KB");
  });
  it("renders 2.5 MB", () => {
    assert.equal(formatBytes(2.5 * 1024 * 1024), "2.5 MB");
  });
  it("renders 1.50 GB", () => {
    assert.equal(formatBytes(1.5 * 1024 * 1024 * 1024), "1.50 GB");
  });
});
