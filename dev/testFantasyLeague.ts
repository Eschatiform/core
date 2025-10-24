/**
 * Test script to verify Fantasy League filtering functionality
 * This script tests the fantasy league system without running the full services
 */
import { 
  addFantasyLeaguePlayers, 
  removeFantasyLeaguePlayer, 
  isFantasyLeagueMatch,
  getAllFantasyLeaguePlayers,
  updateFantasyLeagueTrackedSet
} from '../svc/util/fantasyLeague.ts';

// Test the Fantasy League filtering functionality
async function testFantasyLeague() {
  console.log('Testing Fantasy League filtering...');
  
  // Test 1: Add fantasy league players
  console.log('\n1. Testing addFantasyLeaguePlayers:');
  const testAccountIds = ['76561198000000000', '76561198000000001', '76561198000000002'];
  
  try {
    const result = await addFantasyLeaguePlayers(testAccountIds, 'Test Player', 'Test notes');
    console.log('Added players result:', result);
  } catch (error) {
    console.error('Error adding players:', error);
  }
  
  // Test 2: Test isFantasyLeagueMatch function
  console.log('\n2. Testing isFantasyLeagueMatch function:');
  
  // Sample match data with fantasy league players
  const sampleMatch1 = {
    players: [
      { account_id: '76561198000000000' }, // Should match
      { account_id: '987654321' },
      { account_id: '555666777' }
    ]
  };
  
  // Sample match data without fantasy league players
  const sampleMatch2 = {
    players: [
      { account_id: '111222333' },
      { account_id: '444555666' }
    ]
  };
  
  console.log('Sample match 1 players:', sampleMatch1.players.map(p => p.account_id));
  console.log('Has fantasy league player:', await isFantasyLeagueMatch(sampleMatch1.players));
  
  console.log('Sample match 2 players:', sampleMatch2.players.map(p => p.account_id));
  console.log('Has fantasy league player:', await isFantasyLeagueMatch(sampleMatch2.players));
  
  // Test 3: Get all fantasy league players
  console.log('\n3. Testing getAllFantasyLeaguePlayers:');
  try {
    const allPlayers = await getAllFantasyLeaguePlayers();
    console.log('All fantasy league players:', allPlayers);
  } catch (error) {
    console.error('Error getting all players:', error);
  }
  
  // Test 4: Update tracked set
  console.log('\n4. Testing updateFantasyLeagueTrackedSet:');
  try {
    await updateFantasyLeagueTrackedSet();
    console.log('Successfully updated tracked set');
  } catch (error) {
    console.error('Error updating tracked set:', error);
  }
  
  // Test 5: Remove a player
  console.log('\n5. Testing removeFantasyLeaguePlayer:');
  try {
    const removed = await removeFantasyLeaguePlayer('76561198000000000');
    console.log('Removed player:', removed);
  } catch (error) {
    console.error('Error removing player:', error);
  }
  
  // Test 6: Verify removal
  console.log('\n6. Testing after removal:');
  console.log('Sample match 1 (should now be false):', await isFantasyLeagueMatch(sampleMatch1.players));
  
  // Test 7: Test with empty fantasy league
  console.log('\n7. Testing with empty fantasy league:');
  try {
    // Remove all remaining test players
    await removeFantasyLeaguePlayer('76561198000000001');
    await removeFantasyLeaguePlayer('76561198000000002');
    
    console.log('Sample match 1 (empty league):', await isFantasyLeagueMatch(sampleMatch1.players));
    console.log('Sample match 2 (empty league):', await isFantasyLeagueMatch(sampleMatch2.players));
  } catch (error) {
    console.error('Error in empty league test:', error);
  }
  
  console.log('\nFantasy League filtering test completed!');
}

// Run the test
testFantasyLeague().catch(console.error);
