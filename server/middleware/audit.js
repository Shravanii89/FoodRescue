import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  userId = null,
  userRole = '',
  action,
  entityType,
  entityId = null,
  details = {},
  status = 'SUCCESS'
}) => {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'API Client';

    await AuditLog.create({
      userId: userId || req?.user?._id,
      userRole: userRole || req?.user?.role || 'anonymous',
      action,
      entityType,
      entityId,
      details,
      ipAddress: String(ip),
      userAgent: String(userAgent),
      status
    });
  } catch (err) {
    console.error('Audit log failed silently to avoid interrupting core transaction:', err.message);
  }
};
