// Builds sets of data, e.g. tracked players in the background
import moment from 'moment';
import redis from './store/redis.ts';
import db from './store/db.ts';
import { runInLoop } from './util/utility.ts';
import { updateFantasyLeagueTrackedSet } from './util/fantasyLeague.ts';
import contributors from '../CONTRIBUTORS.ts';

runInLoop(async function buildSets() {
  // Use fantasy league players for tracking
  await updateFantasyLeagueTrackedSet();
  
  // Also maintain the legacy tracked set for backward compatibility
  const subs = await db
    .select<{ account_id: string }[]>(['account_id'])
    .from('subscriber')
    .where('status', '=', 'active');
  const subIds = subs.map((sub) => sub.account_id);
  const contribs = Object.keys(contributors);
  console.log(
    '[BUILDSETS] %s subscribers, %s contributors (legacy)',
    subIds.length,
    contribs.length,
  );
  const tracked: string[] = [...subIds, ...contribs];
  const command = redis.multi();
  command.del('tracked_legacy');
  // Refresh tracked players with expire date in the future
  await Promise.all(
    tracked.map((id) =>
      command.zadd('tracked_legacy', moment.utc().add(1, 'day').format('X'), id),
    ),
  );
  await command.exec();
}, 60 * 1000);
