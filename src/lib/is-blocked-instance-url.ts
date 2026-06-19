export function isBlockedInstanceUrl(url: string): boolean {
  return url.trim().toLowerCase().includes("trundl");
}
