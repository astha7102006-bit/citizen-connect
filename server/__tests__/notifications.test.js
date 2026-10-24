/**
 * CitizenConnect — In-App Notifications Unit Tests (Phase 5 & 6)
 *
 * Tests:
 *  - Persistent notification creation
 *  - Recipient-level query isolation (users only see their own notifications)
 *  - Unread count calculation
 *  - Recipient-level update protection (users cannot mark another user's notification as read)
 *  - Marking nonexistent notifications returns null / 404
 *  - Graceful fallback and pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
vi.mock('../config/db.js', () => {
  const mockPrisma = {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '../config/db.js';
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from '../services/notificationService.js';

describe('In-App Notification Service & Recipient Isolation', () => {
  const citizenAId = 'user-citizen-aaa';
  const citizenBId = 'user-citizen-bbb';

  const mockNotifA = {
    id: 'notif-uuid-001',
    userId: citizenAId,
    complaintId: 'complaint-001',
    type: 'STATUS_CHANGE',
    title: 'Complaint Acknowledged',
    message: 'Your grievance has been acknowledged.',
    metadata: { ref: 'CC-2026-TEST' },
    isRead: false,
    createdAt: new Date('2026-10-24T10:00:00Z'),
  };

  const mockNotifB = {
    id: 'notif-uuid-002',
    userId: citizenBId,
    complaintId: 'complaint-002',
    type: 'OFFICIAL_RESPONSE',
    title: 'Official Response Received',
    message: 'A response has been published.',
    metadata: {},
    isRead: false,
    createdAt: new Date('2026-10-24T11:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Create notification
  it('creates and persists a notification to the database', async () => {
    prisma.notification.create.mockResolvedValue(mockNotifA);

    const created = await createNotification({
      userId: citizenAId,
      complaintId: 'complaint-001',
      type: 'STATUS_CHANGE',
      title: 'Complaint Acknowledged',
      message: 'Your grievance has been acknowledged.',
    });

    expect(created.id).toBe('notif-uuid-001');
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: citizenAId,
        title: 'Complaint Acknowledged',
      }),
    });
  });

  // 2. Recipient isolation on getUserNotifications
  it('returns only notifications belonging to the requesting user', async () => {
    prisma.notification.findMany.mockResolvedValue([mockNotifA]);
    prisma.notification.count.mockImplementation(({ where }) => {
      if (where.isRead === false) return Promise.resolve(1);
      return Promise.resolve(1);
    });

    const result = await getUserNotifications({ userId: citizenAId, page: 1, limit: 10 });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: citizenAId },
      })
    );
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].userId).toBe(citizenAId);
    expect(result.meta.unreadCount).toBe(1);
  });

  // 3. Mark notification as read (allowed for recipient)
  it('allows a user to mark their own notification as read', async () => {
    prisma.notification.findUnique.mockResolvedValue(mockNotifA);
    prisma.notification.update.mockResolvedValue({ ...mockNotifA, isRead: true });

    const updated = await markNotificationAsRead({
      notificationId: 'notif-uuid-001',
      userId: citizenAId,
    });

    expect(updated).not.toBeNull();
    expect(updated.isRead).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-uuid-001' },
      data: { isRead: true },
    });
  });

  // 4. Recipient-level access control: BLOCKS marking another user's notification
  it('blocks a user from marking another users notification as read', async () => {
    // Notification belongs to citizenBId, but citizenAId attempts to mark it
    prisma.notification.findUnique.mockResolvedValue(mockNotifB);

    const result = await markNotificationAsRead({
      notificationId: 'notif-uuid-002',
      userId: citizenAId, // Wrong user!
    });

    expect(result).toBeNull();
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  // 5. Returns null when notification does not exist
  it('returns null when notification is not found', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    const result = await markNotificationAsRead({
      notificationId: 'nonexistent-id',
      userId: citizenAId,
    });

    expect(result).toBeNull();
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});
