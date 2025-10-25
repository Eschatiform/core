import { Client } from 'pg';

const players = [
  { id: 125810080, name: 'Player 1' },
  { id: 36336287, name: 'Player 2' },
  { id: 1026365112, name: 'Player 3' },
  { id: 288497982, name: 'Player 4' },
  { id: 104220693, name: 'Player 5' },
  { id: 258745941, name: 'Player 6' },
  { id: 64206158, name: 'Player 7' }
];

async function addFantasyPlayers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'yasp'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    for (const player of players) {
      try {
        await client.query(
          'INSERT INTO fantasy_league_players (account_id, player_name, notes) VALUES ($1, $2, $3) ON CONFLICT (account_id) DO NOTHING',
          [player.id, player.name, 'Added via script']
        );
        console.log(`Added player ${player.id} (${player.name})`);
      } catch (error) {
        console.log(`Player ${player.id} already exists or error: ${error.message}`);
      }
    }

    // Verify the players were added
    const result = await client.query('SELECT * FROM fantasy_league_players ORDER BY account_id');
    console.log('\nFantasy League Players:');
    result.rows.forEach(row => {
      console.log(`- ${row.account_id}: ${row.player_name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addFantasyPlayers();
