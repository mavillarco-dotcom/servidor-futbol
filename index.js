const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  // CONFIGURACIÓN CORS CORRECTA (Permite Netlify y Celulares)
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  },
});

io.on("connection", (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  // 1. UNIRSE A SALA
  socket.on("join_room", (sala) => {
    socket.join(sala);
    
    // Verificar cuántos hay en la sala
    const tamanioSala = io.sockets.adapter.rooms.get(sala)?.size || 0;
    
    console.log(`Sala: ${sala} | Cantidad de Jugadores: ${tamanioSala}`);

    // Si hay 2 o más personas, arranca el partido
    if (tamanioSala >= 2) {
      io.to(sala).emit("inicio_partido", true);
      console.log(`¡Partido iniciado en sala ${sala}! ⚽`);
    }
  });

  // 2. CANTAR GOL
  socket.on("nuevo_gol", (data) => {
    socket.to(data.room).emit("actualizar_rival", data.goles);
  });

  // 3. ¡ESTO FALTABA! -> CANTAR FALTAS Y TARJETAS 🟨🟥
  socket.on("nueva_falta", (data) => {
    // data trae: { room, tipoTarjeta } (ej: 'amarilla', 'roja')
    // Se lo enviamos al rival para que vea la tarjeta en su pantalla
    socket.to(data.room).emit("rival_falta", data.tipoTarjeta);
    console.log(`Falta en sala ${data.room}: ${data.tipoTarjeta}`);
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado", socket.id);
  });
});

// PUERTO PARA LA NUBE
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`⚽ ÁRBITRO LISTO EN EL PUERTO ${PORT}`);
});