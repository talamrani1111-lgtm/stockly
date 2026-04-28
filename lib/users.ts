import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { kvGet, kvSet } from "./kv";

const LOCAL_FILE = path.join(process.cwd(), ".users.json");
const REDIS_KEY = "users_db";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  role: "admin" | "user";
  createdAt: number;
};

type Verification = {
  userId: string;
  type: "email" | "phone";
  code: string;
  expiresAt: number;
};

type DB = { users: User[]; verifications: Verification[] };

async function readDB(): Promise<DB> {
  const remote = await kvGet<DB>(REDIS_KEY);
  if (remote) return remote;
  try { return JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")); } catch {}
  return { users: [], verifications: [] };
}

async function writeDB(db: DB): Promise<void> {
  await kvSet(REDIS_KEY, db);
  try { fs.writeFileSync(LOCAL_FILE, JSON.stringify(db, null, 2)); } catch {}
}

export async function getUsers(): Promise<User[]> {
  return (await readDB()).users;
}

export async function findUser(username: string): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find(u => u.id === id);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(username: string, password: string, email: string, phone?: string): Promise<User> {
  const db = await readDB();
  const passwordHash = await bcrypt.hash(password, 10);
  const isFirst = db.users.length === 0;
  const user: User = {
    id: crypto.randomUUID(),
    username, passwordHash, email,
    phone: phone || undefined,
    emailVerified: false,
    role: isFirst ? "admin" : "user",
    createdAt: Date.now(),
  };
  db.users.push(user);
  await writeDB(db);
  return user;
}

export async function deleteUser(userId: string): Promise<void> {
  const db = await readDB();
  db.users = db.users.filter(u => u.id !== userId);
  await writeDB(db);
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function createVerificationCode(userId: string, type: "email" | "phone"): Promise<string> {
  const db = await readDB();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.verifications = db.verifications.filter(v => !(v.userId === userId && v.type === type));
  db.verifications.push({ userId, type, code, expiresAt: Date.now() + 15 * 60 * 1000 });
  await writeDB(db);
  return code;
}

export async function verifyCode(userId: string, type: "email" | "phone", code: string): Promise<boolean> {
  const db = await readDB();
  const v = db.verifications.find(v => v.userId === userId && v.type === type && v.code === code);
  if (!v || v.expiresAt < Date.now()) return false;
  db.verifications = db.verifications.filter(v => !(v.userId === userId && v.type === type));
  db.users = db.users.map(u => u.id === userId ? { ...u, emailVerified: type === "email" ? true : u.emailVerified } : u);
  await writeDB(db);
  return true;
}

export function makeToken(userId: string): string {
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

export async function verifyToken(token: string): Promise<User | null> {
  const db = await readDB();
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";
  for (const user of db.users) {
    const expected = crypto.createHmac("sha256", secret).update(user.id).digest("hex");
    if (expected === token) return user;
  }
  // legacy token support (single-user mode)
  const legacyUser = process.env.APP_USERNAME;
  const legacyPass = process.env.APP_PASSWORD;
  if (legacyUser && legacyPass) {
    const legacyToken = crypto.createHmac("sha256", secret).update(`${legacyUser}:${legacyPass}`).digest("hex");
    if (token === legacyToken) {
      return { id: "legacy", username: legacyUser, passwordHash: "", email: "", emailVerified: true, role: "admin", createdAt: 0 };
    }
  }
  return null;
}
