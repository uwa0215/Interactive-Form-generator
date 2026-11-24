import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AUTH_COOKIE = 'fs_admin_token';
export const JWT_SECRET = process.env.JWT_SECRET || 'form-studio-dev-secret';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MIS2026';

export function signAdminToken(email) {
  return jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAdmin(req, res, next) {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
