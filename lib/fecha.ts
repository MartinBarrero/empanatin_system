const ZONA_HORARIA = "America/Bogota";

export function hoyISO(momento: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(momento);
}
