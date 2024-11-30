// Processes a queue of requests for gcdata (replay salts) without parsing
// The parser will also request gcdata if needed
import { getOrFetchGcData } from '../store/getGcData';
import { runQueue } from '../store/queue';
import config from '../config';
import { getOrFetchApiData } from '../store/getApiData';

async function processGcData(job: GcDataJob) {
  const matchId = job.match_id;
  // Note: If we want to enable fetching this for more matches, we can probably store the pgroup in the job to avoid having to fetch the api data blob
  const { pgroup } = await getOrFetchApiData(matchId);
  if (!pgroup) {
    return;
  }
  // We don't need the result, but we do want to respect the DISABLE_REGCDATA setting
  // Currently, just attempt it once and skip if failed
  await getOrFetchGcData(job.match_id, { pgroup });
  await new Promise((resolve) => setTimeout(resolve, 1));
}

console.log('[GCDATA] starting');
runQueue('gcQueue', Number(config.GCDATA_PARALLELISM), processGcData);
