# 🚀 Plan de Refactorización - Multiple Games Architecture

## 🎯 Objetivo
Reestructurar el proyecto para soportar múltiples juegos manteniendo código compartido y separando lógica específica.

## 📁 Nueva Estructura Propuesta

### Backend - Arquitectura Modular
```
backend/
├── server/
│   ├── index.js                 # Servidor principal (solo inicialización)
│   ├── app.js                   # Configuración de Express
│   ├── socketHandler.js         # Handler principal de Socket.IO
│   │
│   ├── core/                    # 🔧 LÓGICA COMPARTIDA
│   │   ├── datastore.js         # Almacén de datos en memoria
│   │   ├── roomManager.js       # Gestión de salas genérica
│   │   ├── playerManager.js     # Gestión de jugadores
│   │   ├── gameRegistry.js      # Registro de juegos disponibles
│   │   └── socketEvents.js      # Eventos socket compartidos
│   │
│   ├── shared/                  # 🔄 SERVICIOS COMPARTIDOS
│   │   ├── services/
│   │   │   ├── statsService.js  # Estadísticas
│   │   │   ├── avatarService.js # Gestión de avatares
│   │   │   └── chatService.js   # Sistema de chat
│   │   ├── middleware/
│   │   │   ├── auth.js          # Autenticación
│   │   │   ├── validation.js    # Validaciones generales
│   │   │   └── compression.js   # Compresión de imágenes
│   │   └── utils/
│   │       ├── logger.js        # Sistema de logging
│   │       ├── constants.js     # Constantes globales
│   │       └── helpers.js       # Utilidades generales
│   │
│   └── games/                   # 🎮 JUEGOS ESPECÍFICOS
│       ├── gameInterface.js     # Interface base para juegos
│       ├── bingo/
│       │   ├── index.js         # Exportaciones del juego
│       │   ├── gameLogic.js     # Lógica específica del bingo
│       │   ├── gameState.js     # Estado del juego bingo
│       │   ├── socketEvents.js  # Eventos específicos del bingo
│       │   ├── validation.js    # Validaciones del bingo
│       │   └── constants.js     # Constantes del bingo
│       ├── cards/               # 🃏 JUEGOS DE CARTAS (FUTURO)
│       │   ├── poker/
│       │   │   ├── index.js
│       │   │   ├── gameLogic.js
│       │   │   ├── gameState.js
│       │   │   └── socketEvents.js
│       │   └── blackjack/
│       │       ├── index.js
│       │       ├── gameLogic.js
│       │       └── gameState.js
│       └── puzzle/              # 🧩 JUEGOS DE ROMPECABEZAS (FUTURO)
│           └── memory/
├── prisma/
│   ├── schema.prisma            # Esquema actualizado para múltiples juegos
│   └── migrations/
└── config/
    ├── database.js              # Configuración de BD
    ├── server.js                # Configuración del servidor
    └── games.js                 # Configuración de juegos
```

### Frontend - Arquitectura por Características
```
frontend/
├── app/                         # 📱 RUTAS (Expo Router)
│   ├── _layout.js              # Layout principal
│   ├── index.js                # Pantalla inicial
│   ├── auth/                   # 🔐 AUTENTICACIÓN
│   │   ├── login.js
│   │   └── profile.js
│   ├── lobby/                  # 🏠 LOBBY GENERAL
│   │   ├── index.js            # Selección de juego
│   │   ├── rooms.js            # Lista de salas
│   │   └── leaderboard.js      # Rankings generales
│   └── games/                  # 🎮 JUEGOS ESPECÍFICOS
│       ├── _layout.js          # Layout para juegos
│       ├── bingo/
│       │   ├── index.js        # Juego de bingo
│       │   ├── lobby.js        # Lobby específico del bingo
│       │   ├── waiting.js      # Sala de espera
│       │   └── leaderboard.js  # Rankings del bingo
│       ├── cards/              # 🃏 JUEGOS DE CARTAS (FUTURO)
│       │   ├── poker/
│       │   └── blackjack/
│       └── puzzle/             # 🧩 ROMPECABEZAS (FUTURO)
├── src/
│   ├── shared/                 # 🔄 LÓGICA COMPARTIDA
│   │   ├── socket/
│   │   │   ├── index.js        # Cliente Socket.IO principal
│   │   │   ├── roomEvents.js   # Eventos de salas compartidos
│   │   │   └── baseEvents.js   # Eventos base
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── ui/             # Componentes básicos UI
│   │   │   ├── game/           # Componentes base para juegos
│   │   │   ├── chat/           # Sistema de chat
│   │   │   └── lobby/          # Componentes de lobby
│   │   ├── hooks/              # Hooks compartidos
│   │   │   ├── useSocket.js    # Hook para Socket.IO
│   │   │   ├── useAuth.js      # Autenticación
│   │   │   ├── useRoom.js      # Gestión de salas
│   │   │   └── useAvatar.js    # Gestión de avatares
│   │   ├── services/           # Servicios
│   │   │   ├── api.js          # Cliente API
│   │   │   ├── storage.js      # AsyncStorage wrapper
│   │   │   ├── avatarCache.js  # Caché de avatares
│   │   │   └── stats.js        # Estadísticas
│   │   ├── store/              # Estado global (Zustand)
│   │   │   ├── authStore.js    # Estado de autenticación
│   │   │   ├── roomStore.js    # Estado de salas
│   │   │   ├── gameStore.js    # Estado base de juegos
│   │   │   └── uiStore.js      # Estado de UI
│   │   └── utils/              # Utilidades
│   │       ├── constants.js    # Constantes
│   │       ├── validation.js   # Validaciones
│   │       └── helpers.js      # Funciones auxiliares
│   │
│   └── games/                  # 🎮 LÓGICA ESPECÍFICA DE JUEGOS
│       ├── gameInterface.js    # Interface base para juegos
│       ├── bingo/
│       │   ├── components/     # Componentes del bingo
│       │   ├── hooks/          # Hooks específicos del bingo
│       │   ├── store/          # Estado específico del bingo
│       │   ├── socket/         # Eventos socket del bingo
│       │   ├── utils/          # Utilidades del bingo
│       │   └── constants.js    # Constantes del bingo
│       ├── cards/              # 🃏 JUEGOS DE CARTAS (FUTURO)
│       └── puzzle/             # 🧩 ROMPECABEZAS (FUTURO)
└── assets/                     # Recursos estáticos
    ├── images/
    │   ├── common/             # Imágenes compartidas
    │   ├── bingo/              # Imágenes del bingo
    │   └── cards/              # Imágenes de cartas
    └── sounds/
        ├── common/             # Sonidos compartidos
        ├── bingo/              # Sonidos del bingo
        └── cards/              # Sonidos de cartas
```

## 🔧 Interfaces y Abstracciones

### Interface Base para Juegos (Backend)
```javascript
// server/games/gameInterface.js
class GameInterface {
  constructor(gameKey, roomId) {
    this.gameKey = gameKey;
    this.roomId = roomId;
  }

  // Métodos que deben implementar todos los juegos
  initializeGame(players, config) { throw new Error('Not implemented'); }
  startGame() { throw new Error('Not implemented'); }
  validateMove(playerId, move) { throw new Error('Not implemented'); }
  processMove(playerId, move) { throw new Error('Not implemented'); }
  checkGameEnd() { throw new Error('Not implemented'); }
  getGameState() { throw new Error('Not implemented'); }
  cleanup() { throw new Error('Not implemented'); }
}
```

### Registry de Juegos
```javascript
// server/core/gameRegistry.js
const gameRegistry = {
  'bingo': {
    name: 'Bingo',
    minPlayers: 1,
    maxPlayers: 10,
    gameClass: require('../games/bingo'),
    config: {
      cardsPerPlayer: { min: 1, max: 4, default: 1 },
      speed: { options: [0.5, 0.75, 1, 1.25, 1.5], default: 1 }
    }
  },
  'poker': {
    name: 'Poker',
    minPlayers: 2,
    maxPlayers: 8,
    gameClass: require('../games/cards/poker'),
    config: {
      blinds: { min: 10, max: 1000, default: 50 }
    }
  }
  // Más juegos...
};
```

## 📊 Base de Datos Actualizada

### Nuevo Schema Prisma
```prisma
model Game {
  gameKey     String   @id
  name        String
  description String?
  minPlayers  Int
  maxPlayers  Int
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  GameSessions GameSession[]
  PlayerGameStats PlayerGameStats[]
}

model GameSession {
  id          String   @id @default(cuid())
  gameKey     String
  roomId      String
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  winnerId    String?
  config      Json     // Configuración específica del juego
  
  Game        Game     @relation(fields: [gameKey], references: [gameKey])
  GameMoves   GameMove[]
}

model GameMove {
  id            String   @id @default(cuid())
  sessionId     String
  playerId      String
  moveData      Json     // Datos específicos del movimiento
  timestamp     DateTime @default(now())
  
  GameSession   GameSession @relation(fields: [sessionId], references: [id])
}

// PlayerGameStats actualizado con gameKey foreign key
model PlayerGameStats {
  id             Int    @id @default(autoincrement())
  playerUsername String
  gameKey        String
  points         Int    @default(0)
  totalGames     Int    @default(0)
  wins           Int    @default(0)
  
  Player         Player @relation(fields: [playerUsername], references: [username])
  Game           Game   @relation(fields: [gameKey], references: [gameKey])
  
  @@unique([playerUsername, gameKey])
}
```

## 🚀 Plan de Migración

### Fase 1: Preparación (Backend)
1. Crear nueva estructura de carpetas
2. Implementar interfaces base
3. Crear registry de juegos
4. Migrar lógica compartida a `core/` y `shared/`

### Fase 2: Refactoring Bingo
1. Mover lógica específica del bingo a `games/bingo/`
2. Implementar interface GameInterface para bingo
3. Actualizar eventos socket específicos

### Fase 3: Frontend Modular
1. Reestructurar componentes en `shared/` y `games/`
2. Implementar hooks compartidos
3. Modularizar stores de Zustand

### Fase 4: Base de Datos
1. Actualizar schema Prisma
2. Migrar datos existentes
3. Actualizar servicios para nuevo schema

### Fase 5: Nuevos Juegos
1. Implementar primer juego de cartas (ejemplo: Poker)
2. Validar arquitectura con múltiples juegos
3. Optimizar y documentar

## 💡 Beneficios de esta Arquitectura

1. **Escalabilidad**: Fácil agregar nuevos juegos
2. **Mantenibilidad**: Código específico separado del compartido  
3. **Reutilización**: Componentes y lógica reutilizable
4. **Testing**: Testeo independiente por módulos
5. **Performance**: Lazy loading de juegos específicos
6. **Colaboración**: Equipos pueden trabajar en paralelo

## 📝 Próximos Pasos

1. ¿Quieres que empecemos con la refactorización del backend?
2. ¿Prefieres comenzar por el frontend?
3. ¿O te gustaría que creemos primero las interfaces y estructura base?

---

**Nota**: Esta reestructuración mantendrá la funcionalidad actual mientras prepara el proyecto para múltiples juegos de forma escalable y mantenible.
