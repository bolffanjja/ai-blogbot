// Prepoznaje kada se mali model "zaglavi" i ponavlja isti komad teksta u krug,
// npr. "u dobru gramatiku, u dobru gramatiku, u dobru gramatiku, ...".
// Čista funkcija (bez mreže i React-a): koristi je server (da zaustavi Ollamu)
// i browser (da iz teksta ukloni ponovljeni deo).

/** Koliko puta zaredom isti komad mora da se ponovi da bismo ga smatrali petljom. */
export const LOOP_REPEATS = 4;
const MIN_UNIT = 6; // najkraći komad (u znakovima)
const MAX_UNIT = 160; // najduži komad (u znakovima)

/**
 * Ako se kraj teksta sastoji od istog komada ponovljenog bar LOOP_REPEATS puta zaredom,
 * vraća poziciju na kojoj treba odseći tekst (posle PRVOG pojavljivanja tog komada).
 * Inače vraća null.
 */
export function findRepetitionLoop(text: string): number | null {
  for (let size = MIN_UNIT; size <= MAX_UNIT; size++) {
    if (text.length < size * LOOP_REPEATS) break;
    const unit = text.slice(-size);
    // Komad mora da sadrži reč (da ne bismo reagovali na npr. "------")
    if (!/\p{L}{2,}/u.test(unit)) continue;

    let repeats = 1;
    while (repeats < LOOP_REPEATS && text.slice(-size * (repeats + 1), -size * repeats) === unit) repeats++;
    if (repeats < LOOP_REPEATS) continue;

    // Idemo unazad znak po znak dok god se tekst ponavlja sa istim razmakom,
    // da nađemo pravi početak petlje (i kad ne počinje tačno na granici komada)
    let start = text.length - size * LOOP_REPEATS;
    while (start > 0 && text[start - 1] === text[start - 1 + size]) start--;
    return start + size; // prvo pojavljivanje ostaje, ponavljanja se uklanjaju
  }
  return null;
}

/** Uklanja petlju sa kraja teksta (ako postoji) i višak razmaka. */
export function removeRepetitionLoop(text: string): string {
  const cut = findRepetitionLoop(text);
  return cut === null ? text : text.slice(0, cut).replace(/[\s,;]+$/, "");
}
