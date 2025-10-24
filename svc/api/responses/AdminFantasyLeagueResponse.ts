/**
 * Admin Fantasy League API Response Handlers
 * Handles CRUD operations for fantasy league players
 */
import { Request, Response, NextFunction } from 'express';
import config from '../../../config.ts';
import { 
  getAllFantasyLeaguePlayers, 
  addFantasyLeaguePlayers, 
  removeFantasyLeaguePlayer 
} from '../../util/fantasyLeague.ts';

/**
 * Middleware to check admin authentication
 */
export function checkAdminAuth(req: Request, res: Response, next: NextFunction) {
  const adminAccountIds = config.ADMIN_ACCOUNT_IDS?.split(',').map(id => id.trim()) || [];
  
  if (adminAccountIds.length === 0) {
    return res.status(403).json({ error: 'Admin access not configured' });
  }

  const userAccountId = req.user?.account_id?.toString();
  
  if (!userAccountId || !adminAccountIds.includes(userAccountId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Get all fantasy league players
 */
export async function getFantasyLeaguePlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const players = await getAllFantasyLeaguePlayers();
    return res.json(players);
  } catch (error) {
    console.error('[FANTASY_LEAGUE_API] Error getting fantasy league players:', error);
    return res.status(500).json({ error: 'Failed to get fantasy league players' });
  }
}

/**
 * Add players to fantasy league
 */
export async function addFantasyLeaguePlayersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { account_ids, player_name, notes } = req.body;

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return res.status(400).json({ error: 'account_ids array is required' });
    }

    // Validate account IDs are strings/numbers
    const validAccountIds = account_ids.filter(id => {
      const numId = Number(id);
      return !isNaN(numId) && numId > 0;
    });

    if (validAccountIds.length === 0) {
      return res.status(400).json({ error: 'No valid account IDs provided' });
    }

    const result = await addFantasyLeaguePlayers(validAccountIds, player_name, notes);
    
    return res.json({
      ...result,
      message: `Added ${result.added} players, ${result.skipped} already existed`
    });
  } catch (error) {
    console.error('[FANTASY_LEAGUE_API] Error adding fantasy league players:', error);
    return res.status(500).json({ error: 'Failed to add fantasy league players' });
  }
}

/**
 * Remove player from fantasy league
 */
export async function removeFantasyLeaguePlayerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { account_id } = req.params;

    if (!account_id) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    const numId = Number(account_id);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ error: 'Invalid account_id' });
    }

    const success = await removeFantasyLeaguePlayer(account_id);
    
    if (!success) {
      return res.status(404).json({ error: 'Player not found in fantasy league' });
    }

    return res.json({ 
      success: true, 
      message: 'Player removed from fantasy league' 
    });
  } catch (error) {
    console.error('[FANTASY_LEAGUE_API] Error removing fantasy league player:', error);
    return res.status(500).json({ error: 'Failed to remove fantasy league player' });
  }
}
