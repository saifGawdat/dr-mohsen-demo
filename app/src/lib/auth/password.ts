import { compare, hash } from "bcryptjs";

/**
 * Password hashing, in one place so the cost factor cannot drift between the
 * register, login and change-password paths.
 *
 * bcrypt is kept rather than swapped for Argon2id because every password
 * already in the database is a bcrypt hash and bcryptjs is pure JavaScript —
 * the Argon2 bindings for Node are native modules, which complicates the
 * `output: "standalone"` build for no meaningful gain at this cost factor.
 */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, COST);
}

/**
 * Constant-time comparison, delegated to bcrypt. Always call this with the
 * stored hash even when the account is missing a password, so the response time
 * does not reveal which accounts exist — see `verifyPasswordDummy`.
 */
export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

/**
 * A real bcrypt hash of a value nobody can supply. Login runs this when the
 * email is unknown so that a miss costs the same time as a wrong password,
 * closing the timing side channel that would otherwise enumerate accounts.
 */
const DUMMY_HASH = "$2a$12$Ux9Ky7NDA0Ry8OeqDsHNyOeaBUzXi0nMDzYQZ7iZ8vHrDCJhLdWXe";

export async function verifyPasswordDummy(plain: string): Promise<void> {
  await compare(plain, DUMMY_HASH);
}
