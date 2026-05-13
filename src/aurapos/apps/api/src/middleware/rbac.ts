import type { IncomingMessage as Request, ServerResponse as Response } from 'node:http';
import { createClient, RedisClientType } from 'redis';

type NextFunction = (err?: Error) => void;

/* -------------------------------------------------------------------------- */
/* Redis setup                                                                */
/* -------------------------------------------------------------------------- */
let redisClient: RedisClientType;
let redisSubscriber: RedisClientType;

async function initRedis(): Promise<void> {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  redisClient = createClient({ url });
  redisSubscriber = redisClient.duplicate();

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

  await redisClient.connect();
  await redisSubscriber.connect();

  await redisSubscriber.subscribe('role:changes', (message) => {
    try {
      const payload = JSON.parse(message);
      if (payload.role) {
        void refreshRoleInCache(payload.role);
      }
    } catch (e) {
      console.error('Failed to parse role change message', e);
    }
  });

  await loadRolesIntoCache();
}

/* -------------------------------------------------------------------------- */
/* Cache loading                                                              */
/* -------------------------------------------------------------------------- */
async function loadRolesIntoCache(): Promise<void> {
  try {
    const roles = await fetchAllRolesWithPermissions();
    for (const { role, permissions } of roles) {
      const key = `role:${role}:permissions`;
      await redisClient.set(key, JSON.stringify(permissions), { EX: 3600 });
    }
    console.log(`Cached ${roles.length} role permission sets`);
  } catch (err) {
    console.error('Failed to load roles into cache', err);
  }
}

async function refreshRoleInCache(role: string): Promise<void> {
  try {
    const permissions = await fetchPermissionsForRole(role);
    const key = `role:${role}:permissions`;
    await redisClient.set(key, JSON.stringify(permissions), { EX: 3600 });
    console.log(`Refreshed cache for role: ${role}`);
  } catch (err) {
    console.error(`Failed to refresh cache for role ${role}`, err);
  }
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */
export function rbacMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req as { user?: { role: string } };
    if (!user.user?.role) {
      return next();
    }

    const key = `role:${user.user.role}:permissions`;
    const cached = await redisClient.get(key);
    if (cached === null) {
      const permissions = await fetchPermissionsForRole(user.user.role);
      await redisClient.set(key, JSON.stringify(permissions), { EX: 3600 });
      (req as any).permissions = permissions;
    } else {
      (req as any).permissions = JSON.parse(cached);
    }
    next();
  };
}

/* -------------------------------------------------------------------------- */
/* Initialize Redis on module load                                            */
/* -------------------------------------------------------------------------- */
if (!redisClient) {
  initRedis().catch(console.error);
}

/* -------------------------------------------------------------------------- */
/* Placeholder imports – adjust to actual project paths                       */
/* -------------------------------------------------------------------------- */
declare function fetchAllRolesWithPermissions(): Promise<
  Array<{ role: string; permissions: string[] }>
>;
declare function fetchPermissionsForRole(role: string): Promise<string[]>;