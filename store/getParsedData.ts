import config from '../config';
import { getRandomParserUrl, redisCount } from '../util/utility';
import { Archive } from './archive';
import cassandra from './cassandra';
import db from './db';
import { insertMatch } from './insert';
import axios from 'axios';

const blobArchive = config.ENABLE_BLOB_ARCHIVE ? new Archive('blob') : null;

/**
 * Return parse data by reading it without fetching.
 * @param matchId
 * @returns
 */
export async function readParseData(
  matchId: number,
  noBlobStore?: boolean,
): Promise<ParserMatch | null> {
  let data = null;
  if (!noBlobStore) {
    const archive = await blobArchive?.archiveGet(`${matchId}_parsed`);
    if (archive) {
      redisCount('blob_archive_read');
    }
    data = archive
      ? (JSON.parse(archive.toString()) as ParserMatch)
      : null
  }
  if (!data) {
    const result = await cassandra.execute(
      'SELECT parsed FROM match_blobs WHERE match_id = ?',
      [matchId],
      { prepare: true, fetchSize: 1, autoPage: true },
    );
    const row = result.rows[0];
    data = row?.parsed ? (JSON.parse(row.parsed) as ParserMatch) : null;
    if (data) {
      redisCount('parsed_cassandra_read');
    }
  }
  return data
}

type ExtraData = {
  leagueid: number;
  start_time: number;
  duration: number;
  origin?: DataOrigin;
  pgroup: PGroup;
};

/**
 * Requests parse data and saves it locally
 * @param matchId
 * @param replayUrl
 * @returns
 */
export async function saveParseData(
  matchId: number,
  replayUrl: string,
  { leagueid, start_time, duration, origin, pgroup }: ExtraData,
): Promise<{ error: string | null }> {
  try {
    // Make a HEAD request for the replay to see if it's available
    await axios.head(replayUrl, { timeout: 5000 });
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.log(e.message);
    }
    return { error: 'Replay not found' };
  }

  // Pipelined for efficiency, but timings:
  // DL: 2967ms (curl http://replay152.valve.net/570/7503212404_1277518156.dem.bz2)
  // bunzip: 6716ms (bunzip2 7503212404_1277518156.dem.bz2)
  // parse: 9407ms (curl -X POST --data-binary "@7503212404_1277518156.dem" odota-parser:5600 > output.log)
  // process: 3278ms (node processors/createParsedDataBlob.mjs < output.log)
  const parseUrl = await getRandomParserUrl(`/blob?replay_url=${replayUrl}`);
  console.log('[PARSER]', parseUrl);
  const resp = await axios.get<ParserMatch>(parseUrl, { timeout: 150000 });
  if (!resp.data) {
    return { error: 'Parse failed' };
  }
  const result: ParserMatch = {
    ...resp.data,
    match_id: matchId,
    leagueid,
    // start_time and duration used for calculating dust adjustments and APM
    start_time,
    duration,
  };
  await insertMatch(result, {
    type: 'parsed',
    origin,
    pgroup,
    endedAt: start_time + duration,
  });
  return { error: null };
}

export async function getOrFetchParseData(
  matchId: number,
  url: string,
  extraData: ExtraData,
): Promise<{
  data: ParserMatch | null;
  skipped: boolean;
  error: string | null;
}> {
  const saved = await readParseData(matchId);
  if (saved) {
    redisCount('reparse');
    if (config.DISABLE_REPARSE) {
      // If high load, we can disable parsing already parsed matches
      return { data: saved, skipped: true, error: null };
    }
  }
  const { error } = await saveParseData(matchId, url, extraData);
  if (error) {
    return { data: null, skipped: false, error };
  }
  // We don't actually need the readback right now, so save some work
  // const result = await readParseData(matchId);
  // if (!result) {
  //   throw new Error('[PARSEDATA]: Could not get data for match ' + matchId);
  // }
  return { data: null, skipped: false, error };
}

export async function checkIsParsed(matchId: number) {
  return Boolean(
    (
      await db.raw('select match_id from parsed_matches where match_id = ?', [
        matchId,
      ])
    ).rows[0],
  );
}
