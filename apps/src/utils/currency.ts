/** Convert baht to satang for database storage */
export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

/** Convert satang from database to baht for API/display */
export function satangToBaht(satang: number): number {
  return satang / 100;
}
