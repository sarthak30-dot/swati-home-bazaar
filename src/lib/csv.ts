/**
 * Minimal RFC 4180 CSV reader.
 *
 * The admin importer previously split on `,` and `\n`, which corrupts any row
 * containing a quoted field with a comma in it — and product names in this
 * catalogue routinely do ("Inox Pressure Cooker 5L, Outer Lid"). Anything
 * exported from Excel or Google Sheets quotes those fields, so a naive split
 * silently shifts every later column in the row by one and writes the wrong
 * price against the wrong SKU.
 *
 * Handles: quoted fields, embedded commas, embedded newlines, `""` as a
 * literal quote, CRLF or LF line endings, and a UTF-8 BOM.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  // A field is only "quoted" if the very first character is a quote; a quote
  // appearing mid-field is literal, which is what spreadsheets emit for
  // inches ('12" pan').
  let fieldStart = true;

  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = "";
    fieldStart = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i] as string;

    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && fieldStart) {
      quoted = true;
      fieldStart = false;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\n") {
      endRow();
    } else if (ch === "\r") {
      // Swallow CR; the following LF closes the row.
      if (input[i + 1] !== "\n") endRow();
    } else {
      field += ch;
      fieldStart = false;
    }
  }

  // A trailing newline leaves an empty pending field, which is not a row.
  if (field !== "" || row.length) endRow();

  // Drop rows that are entirely empty (blank lines, trailing newlines).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Splits a parsed sheet into a normalised header and its data rows.
 *
 * Headers are lowercased and trimmed so `Selling_Price` and `selling_price`
 * both resolve, and `index(name)` returns -1 for a column the sheet omits —
 * callers decide which columns are mandatory.
 */
export function readTable(text: string): {
  header: string[];
  rows: string[][];
  index: (name: string) => number;
  /** Column value for a row, or "" when the column is absent or short. */
  cell: (row: string[], name: string) => string;
} {
  const all = parseCsv(text);
  const header = (all.shift() ?? []).map((h) => h.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);
  const cell = (row: string[], name: string) => {
    const i = index(name);
    return i === -1 ? "" : (row[i] ?? "").trim();
  };
  return { header, rows: all, index, cell };
}
