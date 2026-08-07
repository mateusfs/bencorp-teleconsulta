const PATIENT_LINK_PATH = /^(\/sala\/links\/)([^/]+)(\/resgatar(?:\/)?)$/i;

export function redactSensitivePath(path: string): string {
  return path.replace(PATIENT_LINK_PATH, '$1[REDACTED]$3');
}
