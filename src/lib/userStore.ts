/**
 * In-memory user store — simulates a real database.
 *
 * In production you would replace this with a PostgreSQL query via an ORM
 * (Prisma, Drizzle, Kysely) or a raw pg pool. The interface stays the same.
 *
 * Passwords are bcrypt-hashed (we use Node crypto for the demo to avoid
 * adding bcrypt as a dep — swap for bcrypt / argon2 in production).
 */

import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

// ─── Simple demo hash (SHA-256 + salt) ───────────────────────────────────────
// In production: use bcrypt.hash / argon2.hash
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function makeSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ─── In-memory store ──────────────────────────────────────────────────────────
const users = new Map<string, User>(); // keyed by email

// Pre-seed a couple of test accounts
(function seed() {
  const seed1Salt = makeSalt();
  const seed2Salt = makeSalt();
  users.set('alice@auren.com', {
    id: 'user-alice',
    email: 'alice@auren.com',
    passwordHash: `${seed1Salt}:${hashPassword('password123', seed1Salt)}`,
    name: 'Alice',
    createdAt: new Date().toISOString(),
  });
  users.set('bob@auren.com', {
    id: 'user-bob',
    email: 'bob@auren.com',
    passwordHash: `${seed2Salt}:${hashPassword('password123', seed2Salt)}`,
    name: 'Bob',
    createdAt: new Date().toISOString(),
  });
})();

// ─── Public API ───────────────────────────────────────────────────────────────

export function findUserByEmail(email: string): User | undefined {
  return users.get(email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  for (const u of users.values()) {
    if (u.id === id) return u;
  }
  return undefined;
}

export function verifyPassword(user: User, password: string): boolean {
  const [salt, hash] = user.passwordHash.split(':');
  return hashPassword(password, salt) === hash;
}

export function createUser(email: string, password: string, name: string): User {
  const salt = makeSalt();
  const user: User = {
    id: `user-${crypto.randomBytes(8).toString('hex')}`,
    email: email.toLowerCase(),
    passwordHash: `${salt}:${hashPassword(password, salt)}`,
    name,
    createdAt: new Date().toISOString(),
  };
  users.set(user.email, user);
  return user;
}

export function userExists(email: string): boolean {
  return users.has(email.toLowerCase());
}
