-- Add fantasy league players
INSERT INTO fantasy_league_players (account_id, player_name, notes) VALUES
(125810080, 'Player 1', 'Added via script'),
(36336287, 'Player 2', 'Added via script'),
(1026365112, 'Player 3', 'Added via script'),
(288497982, 'Player 4', 'Added via script'),
(104220693, 'Player 5', 'Added via script'),
(258745941, 'Player 6', 'Added via script'),
(64206158, 'Player 7', 'Added via script')
ON CONFLICT (account_id) DO NOTHING;
