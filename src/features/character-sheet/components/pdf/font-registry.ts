import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Resolved lazily so cold-start renders don't hit FS until first PDF is built.
const fontDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontDir, "Inter-Regular.ttf") },
    { src: path.join(fontDir, "Inter-Bold.ttf"), fontWeight: "bold" },
  ],
});

Font.register({
  family: "Spectral",
  fonts: [
    { src: path.join(fontDir, "Spectral-Regular.ttf") },
    { src: path.join(fontDir, "Spectral-Italic.ttf"), fontStyle: "italic" },
  ],
});

Font.register({
  family: "Cinzel",
  fonts: [
    { src: path.join(fontDir, "Cinzel-Regular.ttf") },
    { src: path.join(fontDir, "Cinzel-Bold.ttf"), fontWeight: "bold" },
  ],
});
