import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Support test tokens for automated test suites and local integration testing (disabled in production)
  if (process.env.NODE_ENV !== 'production' && token.startsWith('test-token-')) {
    const uid = token.replace('test-token-', '').trim();
    req.user = {
      uid,
      email: `${uid}@farmpal.test`,
      name: `Test Farmer (${uid})`,
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Optional auth helper: attaches user if token is present, continues even if not
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (process.env.NODE_ENV !== 'production' && token.startsWith('test-token-')) {
      const uid = token.replace('test-token-', '').trim();
      req.user = {
        uid,
        email: `${uid}@farmpal.test`,
        name: `Test Farmer (${uid})`,
      };
      return next();
    }
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

// Production safety middleware: blocks destructive/reset/shell routes when in production
export const requireDevOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden: Destructive test and admin endpoints are disabled in production',
    });
  }
  next();
};
