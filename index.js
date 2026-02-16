const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  // El cors origin "*" permite que se conecten desde cualquier lugar (Tu PC, Celular, Netlify, Japón, etc.)
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  // 1. UNIRSE A SALA
  socket.on("join_room", (sala) => {
    socket.join(sala);
    
    // Verificar cuántos hay en la sala
    // (Usamos ?.size por seguridad, si la sala no existe devuelve 0)
    const tamanioSala = io.sockets.adapter.rooms.get(sala)?.size || 0;
    
    console.log(`Sala: ${sala} | Cantidad de Jugadores: ${tamanioSala}`);

    // CORRECCIÓN "ANTIFANTASMA": 
    // Usamos >= 2. Si por error hay 3 conexiones (1 fantasma), arranca igual.
    if (tamanioSala >= 2) {
      io.to(sala).emit("inicio_partido", true);
      console.log(`¡Partido iniciado en sala ${sala}! ⚽`);
    }
  });

  // 2. CANTAR GOL (Actualizar marcador del rival)
  socket.on("nuevo_gol", (data) => {
    // data trae: { room, goles }
    // Enviamos el dato a TODOS los demás en la sala menos a mí
    socket.to(data.room).emit("actualizar_rival", data.goles);
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado", socket.id);
  });
});

// --- PARTE CRÍTICA PARA LA NUBE ---
// Render nos dará un puerto en process.env.PORT. Si no hay (estamos en casa), usa el 3001.
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`⚽ ÁRBITRO LISTO EN EL PUERTO ${PORT}`);
});