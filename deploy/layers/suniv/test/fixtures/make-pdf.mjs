import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const escapeText = (line) => String(line).replace(/([\\()])/g, "\\$1");

function contentStream(lines) {
  const body = lines.map((line) => `(${escapeText(line)}) Tj T*`).join("\n");
  return `BT\n/F1 12 Tf\n72 720 Td\n16 TL\n${body}\nET\n`;
}

export function pdfBytes(pages) {
  const objects = [];
  const pageIds = pages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  for (const [index, lines] of pages.entries()) {
    const contentId = pageIds[index] + 1;
    const stream = contentStream(lines);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R ` +
        `/Resources << /Font << /F1 ${pageIds.length * 2 + 3} 0 R >> >> >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
  }
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

  let out = "%PDF-1.4\n";
  const offsets = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(out.length);
    out += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) out += `${String(offset).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

export function writePdf(name, pages) {
  const path = join(mkdtempSync(join(tmpdir(), "suniv-pdf-")), name);
  writeFileSync(path, pdfBytes(pages));
  return path;
}

export const NUMBERED_PAPER = [
  [
    "arXiv:2601.01234v1 [cs.LG] 4 Jan 2026",
    "Calibrating Low Cost Particulate Sensors In The Field",
    "Marie Dupont, Wei Chen",
    "ABSTRACT",
    "We calibrate low cost sensors against a reference station.",
  ],
  [
    "1. INTRODUCTION",
    "Low cost sensors drift with humidity.",
    "2. RELATED WORK",
    "Earlier work relied on laboratory chambers.",
  ],
  [
    "3. METHODS",
    "3.1 Reference instrumentation",
    "The reference station is a beta attenuation monitor.",
    "3.2 Experimental setup",
    "Sensors were co located for ninety days.",
    "4. RESULTS",
    "The corrected error falls by a factor of three.",
  ],
];

export const UNNUMBERED_PAPER = [
  ["A Study Without Any Conventional Section Numbering", "Alice Bernard"],
  [
    "What we set out to do",
    "We wanted to know whether the effect survives replication.",
    "How we went about it",
    "We repeated the original protocol with a larger cohort.",
  ],
];
