const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const games = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { gameId, action, payload } = data;

        if (!games[gameId]) {
            games[gameId] = { players: [] };
        }

        const game = games[gameId];

        switch (action) {
            case 'join':
                if (game.players.length < 2) {
                    game.players.push(ws);
                    ws.send(JSON.stringify({ action: 'joined', player: game.players.length }));
                    if (game.players.length === 2) {
                        game.players.forEach(player => player.send(JSON.stringify({ action: 'start' })));
                    }
                }
                break;
            case 'move':
                game.players.forEach(player => {
                    if (player !== ws) {
                        player.send(JSON.stringify({ action: 'move', payload }));
                    }
                });
                break;
        }
    });

    ws.on('close', () => {
        Object.keys(games).forEach(gameId => {
            const game = games[gameId];
            game.players = game.players.filter(player => player !== ws);
            if (game.players.length === 0) {
                delete games[gameId];
            }
        });
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
