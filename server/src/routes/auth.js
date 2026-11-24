import { Router } from 'express';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AUTH_COOKIE,
  requireAdmin,
  signAdminToken,
} from '../auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (
    email.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase() ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signAdminToken(ADMIN_EMAIL);

  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return res.json({
    admin: { email: ADMIN_EMAIL, role: 'admin' },
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  return res.json({
    admin: { email: req.admin.email, role: req.admin.role },
  });
});

export default router;
