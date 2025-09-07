// Processes a queue of auto player cache requests
import { populateTemp } from './util/buildPlayer.ts';
import { runQueue } from './store/queue.ts';
import { redisCount, redisCountDistinct } from './util/utility.ts';

runQueue('cacheQueue', 10, async (job: CacheJob) => {
  const accountId = job;
  console.time(accountId);
  redisCountDistinct('distinct_auto_player_temp', accountId);
  redisCount('auto_player_temp');
  await populateTemp(Number(accountId), ['match_id']);
  console.timeEnd(accountId);
});
