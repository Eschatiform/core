#!/usr/bin/env node

// Script to add fantasy league players
const players = [
  { id: 125810080 },
  { id: 36336287 },
  { id: 1026365112 },
  { id: 288497982 },
  { id: 104220693 },
  { id: 258745941 },
  { id: 64206158 }
];

console.log('Adding fantasy league players:', players.map(p => p.id).join(', '));

// This will be run inside the container
const { addFantasyLeaguePlayers } = require('./svc/util/fantasyLeague.ts');

async function addPlayers() {
  try {
    const accountIds = players.map(p => p.id.toString());
    const result = await addFantasyLeaguePlayers(accountIds, 'Test Fantasy League', 'Added via script');
    console.log('Result:', result);
    console.log(`Added ${result.added} players, ${result.skipped} already existed`);
  } catch (error) {
    console.error('Error adding players:', error);
  }
}

addPlayers();
