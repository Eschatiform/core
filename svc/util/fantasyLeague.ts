/**
 * Fantasy League Player Tracking Utility
 * Manages fantasy league players with caching and provides match filtering
 */
import db from '../store/db.ts';
import redis from '../store/redis.ts';

interface FantasyLeaguePlayer {
  account_id: bigint;
  player_name?: string;
  added_at: Date;
  notes?: string;
}

let fantasyLeaguePlayers: Set<string> = new Set();
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Loads fantasy league players from database with caching
 * Returns a Set of Steam account IDs to track
 */
export async function getFantasyLeaguePlayers(): Promise<Set<string>> {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (now - lastCacheUpdate < CACHE_DURATION && fantasyLeaguePlayers.size > 0) {
    return fantasyLeaguePlayers;
  }

  try {
    const players = await db
      .select<FantasyLeaguePlayer[]>(['account_id', 'player_name', 'added_at', 'notes'])
      .from('fantasy_league_players')
      .orderBy('added_at', 'desc');

    fantasyLeaguePlayers.clear();
    players.forEach(player => {
      fantasyLeaguePlayers.add(String(player.account_id));
    });

    lastCacheUpdate = now;
    console.log(`[FANTASY_LEAGUE] Loaded ${fantasyLeaguePlayers.size} fantasy league players`);
    
    return fantasyLeaguePlayers;
  } catch (error) {
    console.error('[FANTASY_LEAGUE] Error loading fantasy league players:', error);
    return new Set();
  }
}

/**
 * Checks if any player in a match is in the fantasy league
 * @param players Array of player objects with account_id property
 * @returns true if any player should be tracked, false otherwise
 */
export async function isFantasyLeagueMatch(players: Array<{ account_id?: number | string }>): Promise<boolean> {
  const fantasyPlayers = await getFantasyLeaguePlayers();
  
  // If no fantasy league players configured, don't process any matches
  if (fantasyPlayers.size === 0) {
    return false;
  }

  return players.some(player => {
    const accountId = String(player.account_id);
    return fantasyPlayers.has(accountId);
  });
}

/**
 * Updates the Redis tracked set with fantasy league players
 * This replaces the default tracked players with the fantasy league list
 */
export async function updateFantasyLeagueTrackedSet(): Promise<void> {
  const fantasyPlayers = await getFantasyLeaguePlayers();
  
  if (fantasyPlayers.size === 0) {
    console.log('[FANTASY_LEAGUE] No fantasy league players to track');
    return;
  }

  // Clear existing tracked set
  await redis.del('tracked');
  
  // Add fantasy league Steam IDs to tracked set with future expiry
  const command = redis.multi();
  const expireTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
  
  for (const steamId of fantasyPlayers) {
    command.zadd('tracked', expireTime, steamId);
  }
  
  await command.exec();
  console.log(`[FANTASY_LEAGUE] Updated tracked set with ${fantasyPlayers.size} fantasy league players`);
}

/**
 * Adds players to the fantasy league
 * @param accountIds Array of Steam account IDs to add
 * @param playerName Optional player name
 * @param notes Optional notes
 */
export async function addFantasyLeaguePlayers(
  accountIds: string[],
  playerName?: string,
  notes?: string
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  for (const accountId of accountIds) {
    try {
      await db('fantasy_league_players').insert({
        account_id: BigInt(accountId),
        player_name: playerName,
        notes: notes
      });
      added++;
    } catch (error: any) {
      // Skip if already exists (duplicate key)
      if (error.code === '23505') {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  // Clear cache to force reload
  fantasyLeaguePlayers.clear();
  lastCacheUpdate = 0;

  return { added, skipped };
}

/**
 * Removes a player from the fantasy league
 * @param accountId Steam account ID to remove
 */
export async function removeFantasyLeaguePlayer(accountId: string): Promise<boolean> {
  const result = await db('fantasy_league_players')
    .where('account_id', accountId)
    .del();

  // Clear cache to force reload
  fantasyLeaguePlayers.clear();
  lastCacheUpdate = 0;

  return result > 0;
}

/**
 * Gets all fantasy league players
 */
export async function getAllFantasyLeaguePlayers(): Promise<FantasyLeaguePlayer[]> {
  return await db
    .select<FantasyLeaguePlayer[]>(['account_id', 'player_name', 'added_at', 'notes'])
    .from('fantasy_league_players')
    .orderBy('added_at', 'desc');
}
