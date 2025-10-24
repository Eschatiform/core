# Fantasy League Player Tracking System

## Overview

The Fantasy League Player Tracking System allows you to configure the OpenDota system to only parse and retrieve matches for specific Steam account IDs stored in a database table. This replaces the default tracked players system (subscribers + contributors) with a custom fantasy league player list.

## Key Features

- ✅ **Database-driven**: Fantasy league players stored in `fantasy_league_players` table
- ✅ **Full processing**: All matched games get API + GC data + parsing automatically  
- ✅ **No league matches**: League/tournament matches are NOT processed (as requested)
- ✅ **Admin API**: RESTful endpoints to manage fantasy league players
- ✅ **Caching**: Fantasy league player list cached in memory, refreshed every 5 minutes
- ✅ **Backward compatibility**: Legacy tracked set maintained for compatibility

## Database Schema

### Fantasy League Players Table

```sql
CREATE TABLE IF NOT EXISTS fantasy_league_players (
  account_id bigint PRIMARY KEY,
  player_name varchar(255),
  added_at timestamp with time zone DEFAULT NOW(),
  notes text
);
CREATE INDEX IF NOT EXISTS fantasy_league_players_account_id_idx ON fantasy_league_players(account_id);
```

## System Behavior

### Scanner Service
- **Before**: Processed all matches from Steam API
- **After**: Only processes matches containing fantasy league players

### Parser Service  
- **Before**: Parsed matches with tracked players OR league matches
- **After**: Parses ONLY matches with fantasy league players (NO league matches)

### Buildsets Service
- **Before**: Populated Redis `tracked` set with subscribers + contributors
- **After**: Populates Redis `tracked` set with fantasy league players only

## API Endpoints

### List Fantasy League Players
```bash
GET /api/admin/fantasy-league
```

**Response:**
```json
[
  {
    "account_id": "76561198000000000",
    "player_name": "Test Player",
    "added_at": "2024-01-01T00:00:00Z",
    "notes": "Test notes"
  }
]
```

### Add Players to Fantasy League
```bash
POST /api/admin/fantasy-league
Content-Type: application/json

{
  "account_ids": ["76561198000000000", "76561198000000001"],
  "player_name": "Optional Player Name",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "added": 2,
  "skipped": 0,
  "message": "Added 2 players, 0 already existed"
}
```

### Remove Player from Fantasy League
```bash
DELETE /api/admin/fantasy-league/76561198000000000
```

**Response:**
```json
{
  "success": true,
  "message": "Player removed from fantasy league"
}
```

## Setup Instructions

### 1. Database Migration
Run the migration to create the fantasy league players table:

```bash
# For new installations, the table is created automatically
# For existing installations, run:
psql -d yasp -f sql/migrations.sql
```

### 2. Add Fantasy League Players
Use the API to add players:

```bash
curl -X POST http://localhost:5000/api/admin/fantasy-league \
  -H "Content-Type: application/json" \
  -d '{"account_ids": ["76561198000000000", "76561198000000001"]}'
```

### 3. Start Services
```bash
pm2 start ecosystem.config.js --only scanner,parser,retriever
```

## Testing

Run the test script to verify functionality:

```bash
npm run ts-node dev/testFantasyLeague.ts
```

## Implementation Details

### Files Modified/Created

1. **Database Schema**
   - `sql/create_tables.sql` - Added fantasy_league_players table
   - `sql/migrations.sql` - Migration script for existing databases

2. **Core Logic**
   - `svc/util/fantasyLeague.ts` - NEW: Core fantasy league utilities
   - `svc/scanner.ts` - Filter matches by fantasy league players
   - `svc/util/insert.ts` - Remove league logic, add fantasy league check
   - `svc/buildsets.ts` - Use fantasy league players for tracked set

3. **API Layer**
   - `svc/api/spec.ts` - Added admin endpoints
   - `svc/api/responses/AdminFantasyLeagueResponse.ts` - NEW: API handlers

4. **Testing**
   - `dev/testFantasyLeague.ts` - NEW: Test script

### Key Functions

- `isFantasyLeagueMatch(players)` - Check if match contains fantasy league players
- `getFantasyLeaguePlayers()` - Load fantasy league players with caching
- `updateFantasyLeagueTrackedSet()` - Update Redis tracked set
- `addFantasyLeaguePlayers()` - Add players to fantasy league
- `removeFantasyLeaguePlayer()` - Remove player from fantasy league

## Security

- Admin endpoints require authentication via `ADMIN_ACCOUNT_IDS` environment variable
- Input validation for Steam account IDs
- Error handling for database operations

## Performance

- Fantasy league player list cached in memory for 5 minutes
- Database queries optimized with indexes
- Redis operations batched for efficiency

## Monitoring

The system logs important events:
- Fantasy league player list updates
- Tracked set population
- API operations (add/remove players)

## Troubleshooting

### No Matches Being Processed
1. Check if fantasy league players are added: `GET /api/admin/fantasy-league`
2. Verify scanner is running: `pm2 logs scanner`
3. Check Redis tracked set: `redis-cli ZRANGE tracked 0 -1`

### API Errors
1. Verify `ADMIN_ACCOUNT_IDS` is configured
2. Check database connection
3. Ensure user is authenticated

### Performance Issues
1. Monitor fantasy league player count (too many players = slower filtering)
2. Check Redis memory usage
3. Verify database indexes are created

## Migration from Previous System

The fantasy league system completely replaces the previous tracked players system:

- **Old**: Subscribers + Contributors + League matches
- **New**: Fantasy league players only (NO league matches)

This means:
- League matches will NOT be processed anymore
- Only matches with fantasy league players will be processed
- Full API + GC data + parsing for all fantasy league matches
