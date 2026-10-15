import "server-only";

// Description history is recorded by a database trigger only for this account.
const OWNER_EMAIL = "maiqued.18@gmail.com";

export function isOwnerEmail(email: string | null | undefined) {
  return email?.toLocaleLowerCase() === OWNER_EMAIL;
}
