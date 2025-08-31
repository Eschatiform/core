const { db } = await import('../svc/store/db.ts');
const { upsert } = await import('../svc/util/insert.ts');

const matches = await db
  .select(['radiant_team_id', 'dire_team_id', 'match_id'])
  .from('matches');
matches.forEach((match: any) => {
  console.log(match.match_id);
  const arr: any[] = [];
  if (match.radiant_team_id) {
    arr.push({
      team_id: match.radiant_team_id,
      match_id: match.match_id,
      radiant: true,
    });
  }
  if (match.dire_team_id) {
    arr.push({
      team_id: match.dire_team_id,
      match_id: match.match_id,
      radiant: false,
    });
  }
  arr.forEach(async (tm) => {
    await upsert(db, 'team_match', tm, {
      team_id: tm.team_id,
      match_id: tm.match_id,
    });
  });
});
