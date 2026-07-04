const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { PinataSDK } = require("pinata-web3");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware parsing JSON
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DB_URL
});

// Inisialisasi Pinata
const pinata = new PinataSDK({
    pinataJwt:process.env.PINATA_JWT,
});

async function initDb(retries = 5) {
    while (retries) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS posts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    content_cid TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);
            console.log("Database siap dan tabel posts terverifikasi.");
            return;
        } catch (err) {
            console.error(`Gagal konek, sisa percobaan: ${retries - 1}.`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

initDb();

// Endpoint menyimpan curhatan
app.post('/posts', async (req, res) => {
    const { content } = req.body;
    
    if (!content) return res.status(400).json({ error: "Isi curhatan tidak boleh kosong" });

    try {
        console.log("Mencoba upload ke Pinata...");
        
        // Upload ke IPFS
        const upload = await pinata.upload.json({ content: content });
        
        console.log("ISI OBJEK UPLOAD:", JSON.stringify(upload, null, 2));

        // Ambil IpfsHash sebagai CID
        const cid = upload.IpfsHash;

        // Validasi CID
        if (!cid) {
            throw new Error("Gagal mendapatkan IpfsHash dari respons Pinata");
        }

        console.log("Berhasil upload, CID didapat:", cid);

        // Simpan ke database menggunakan kolom content_cid
        const result = await pool.query(
            'INSERT INTO posts (content_cid) VALUES ($1) RETURNING *',
            [cid]
        );
        
        io.emit('new_post', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("DEBUG ERROR DETAIL:", err.message);
        res.status(500).json({ error: "Gagal memproses curhatan", details: err.message });
    }
});

io.on('connection', (socket) => {
    console.log('User terhubung ke Ruang:', socket.id);
});

server.listen(8080, () => {
    console.log('Server Ruang berjalan di port 8080');
});