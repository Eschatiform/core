// Updates the list of leagues in the database
import axios from 'axios';
import db from './store/db.ts';
import { upsert } from './util/insert.ts';
import { runInLoop } from './util/utility.ts';

runInLoop(async function leagues() {
  const url = 'http://www.dota2.com/webapi/IDOTA2League/GetLeagueInfoList/v001';
  const resp = await axios.get(url);
  const apiLeagues = resp.data.infos;
  console.log('[LEAGUES]', apiLeagues.length, 'leagues');
  for (let i = 0; i < apiLeagues.length; i++) {
    const league = apiLeagues[i];
    const openQualifierTier =
      league.name.indexOf('Open Qualifier') === -1 ? null : 'excluded';
    let eventTier = 'excluded';
    if (league.tier === 2) {
      eventTier = 'professional';
    } else if (league.tier >= 3) {
      eventTier = 'premium';
    }
    if (league.league_id === 4664) {
      eventTier = 'premium';
    }
    league.tier = openQualifierTier ?? eventTier;
    league.ticket = null;
    league.banner = null;
    league.leagueid = league.league_id;
    await upsert(db, 'leagues', league, {
      leagueid: league.league_id,
    });
  }
}, 30 * 60 * 1000);
