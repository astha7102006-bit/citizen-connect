/**
 * CitizenConnect — Departments API Router (Phase 5)
 *
 * GET /api/departments — Public list of all active departments
 *                        Used by frontend for dropdown selection in complaint wizard
 *                        and transfer modal.
 */

import { Router } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// ── GET /api/departments ──────────────────────────────────────────────────────
// Public endpoint — no auth required (departments are public government bodies)
router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        contactEmail: true,
        contactPhone: true,
        officeLocation: true,
        slaDaysLevel1: true,
        slaDaysLevel2: true,
        slaDaysLevel3: true,
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, { departments });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code });
    }
    return next(err);
  }
});

export default router;
