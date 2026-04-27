import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";

const DB_FILE = process.env.VERCEL ? "/tmp/users.json" : path.join(process.cwd(), ".users.json");

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

function readDB(): DB {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { users: [], verifications: [] };
  }
}

function writeDB(db: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getUsers(): User[] { return readDB().users; }

export function findUser(username: string): User | undefined {
  return readDB().users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return readDB().users.find(u => u.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  return readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(username: string, password: string, email: string, phone?: string): Promise<User> {
  const db = readDB();
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
  writeDB(db);
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export function createVerificationCode(userId: string, type: "email" | "phone"): string {
  const db = readDB();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.verifications = db.verifications.filter(v => !(v.userId === userId && v.type === type));
  db.verifications.push({ userId, type, code, expiresAt: Date.now() + 15 * 60 * 1000 });
  writeDB(db);
  return code;
}

export function verifyCode(userId: string, type: "email" | "phone", code: string): boolean {
  const db = readDB();
  const v = db.verifications.find(v => v.userId === userId && v.type === type && v.code === code);
  if (!v || v.expiresAt < Date.now()) return false;
  db.verifications = db.verifications.filter(v => !(v.userId === userId && v.type === type));
  db.users = db.users.map(u => u.id === userId ? { ...u, emailVerified: type === "email" ? true : u.emailVerified } : u);
  writeDB(db);
  return true;
}

export function makeToken(userId: string): string {
  const secret = process.env.APP_SECRET ?? "stock-tracker-secret-2026";
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

export function verifyToken(token: string): User | null {
  const db = readDB();
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
