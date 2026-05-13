/**
 * Parser CSV simple — sans dépendance externe (papaparse, csv-parse).
 *
 * Couvre les besoins B2B Carlow :
 *  - Délimiteur configurable (auto-détection `,` ou `;` selon la 1ère ligne)
 *  - Valeurs entre guillemets avec échappement `""`
 *  - Sauts de ligne dans une valeur quotée (RFC 4180 partiel)
 *  - Trim des valeurs non-quotées
 *  - Ignore les lignes vides
 *
 * ⚠️ Pour des CSV vraiment exotiques (encodage non-UTF8, séparateurs
 * mixtes), papaparse reste plus robuste. Mais pour Excel/Numbers
 * export standard, ce parser suffit largement.
 */

export interface ParsedRow {
  rowIndex: number; // 1-based, ligne 1 = première ligne de données (après header)
  data: Record<string, string>;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  delimiter: string;
  errors: { rowIndex: number; message: string }[];
}

/**
 * Détecte automatiquement le délimiteur (entre `,` et `;`).
 * On compte les occurrences dans la première ligne — celui qui apparaît
 * le plus souvent gagne. Fallback : `,`.
 */
function detectDelimiter(firstLine: string): string {
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  if (semi > comma) return ";";
  return ",";
}

/**
 * Tokenize une ligne CSV en gérant les champs quotés.
 * Implémentation itérative car les CSV peuvent être longs.
 */
function tokenize(input: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (inQuotes) {
      if (ch === '"') {
        // Échappement "" → un seul "
        if (input[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // Fin de champ quoté
        inQuotes = false;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    // hors quote
    if (ch === '"' && current === "") {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      result.push(current);
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  result.push(current);
  return result.map((v) => v.trim());
}

export function parseCsv(text: string): ParseResult {
  const errors: { rowIndex: number; message: string }[] = [];
  // Normalise les fins de lignes
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // On split en lignes mais en respectant les sauts dans les quotes.
  // Pour simplifier, on découpe naïvement par "\n" puis on agrège les
  // lignes "non équilibrées" en quotes. Bon compromis perf/correction.
  const rawLines = normalized.split("\n");
  const lines: string[] = [];
  let buffer = "";
  for (const rl of rawLines) {
    buffer += (buffer ? "\n" : "") + rl;
    // Compte les " non échappés
    const quotes = (buffer.match(/"/g) ?? []).length;
    if (quotes % 2 === 0) {
      // équilibré → on consomme cette ligne
      if (buffer.trim() !== "") lines.push(buffer);
      buffer = "";
    }
    // sinon on attend la prochaine ligne pour boucler
  }
  if (buffer.trim() !== "") lines.push(buffer);

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: ",", errors };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = tokenize(lines[0]!, delimiter).map((h) =>
    h.toLowerCase().replace(/^"|"$/g, "")
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const tokens = tokenize(lines[i]!, delimiter);
    if (tokens.length === 1 && tokens[0]!.trim() === "") continue; // ligne vide
    if (tokens.length !== headers.length) {
      errors.push({
        rowIndex: i,
        message: `${headers.length} colonnes attendues, ${tokens.length} trouvées`,
      });
      continue;
    }
    const data: Record<string, string> = {};
    headers.forEach((h, idx) => {
      data[h] = tokens[idx] ?? "";
    });
    rows.push({ rowIndex: i, data });
  }

  return { headers, rows, delimiter, errors };
}
