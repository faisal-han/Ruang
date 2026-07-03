const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg'); // Import pg

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


const pool = new Pool({
    connectionString: process.env.DB_URL
});


async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("Database siap dan tabel posts terverifikasi.");
    } catch (err) {
        console.error("Gagal inisialisasi database:", err);
    }
}

initDb();

io.on('connection', (socket) => {
    console.log('User terhubung ke Ruang:', socket.id);
});

server.listen(8080, () => {
    console.log('Server Ruang berjalan di port 8080');
});