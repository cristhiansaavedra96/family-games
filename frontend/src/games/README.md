# Family Games - Estructura del Proyecto

## Arquitectura del Frontend

El frontend está organizado de manera modular para soportar múltiples juegos:

```
src/
├── games/                    # Todos los juegos
│   ├── index.js             # Exportaciones generales de juegos
│   └── bingo/               # Juego del Bingo
│       ├── index.js         # Exportaciones del bingo
│       ├── components/      # Componentes específicos del bingo
│       │   └── BingoCard.js # Componente del cartón 5x5
│       ├── hooks/           # Hooks personalizados del bingo  
│       │   └── useBingoAnimations.js # Hook para animaciones
│       └── utils/           # Utilidades del bingo
│           ├── layout.js    # Cálculos de diseño y layout
│           └── voice.js     # Funciones de voz específicas
├── utils/                   # Utilidades generales
│   ├── index.js            # Exportaciones de utilidades
│   └── voice.js            # Funciones generales de voz
└── socket.js               # Configuración de Socket.io
```

## Arquitectura del Backend

El backend también está organizado por juegos:

```
server/
├── index.js                 # Servidor principal
└── games/                  # Todos los juegos
    └── bingo/              # Juego del Bingo
        ├── index.js        # Exportaciones del bingo
        ├── handler.js      # Manejador de eventos del bingo
        └── logic.js        # Lógica del juego de bingo
```

## Uso

### Importar componentes del Bingo

```javascript
import { Bingo } from '../src/games';

// Componentes
<Bingo.BingoCard />

// Hooks
const animations = Bingo.useBingoAnimations();

// Utilidades
const layout = Bingo.calculateCardLayout(numCards, width, height);
const cardSize = Bingo.getCardSize(numCards);
Bingo.speakBingoNumber(42);
```

### Agregar nuevos juegos

Para agregar un nuevo juego (ej: "domino"):

1. Crear carpeta: `src/games/domino/`
2. Estructura similar al bingo:
   ```
   domino/
   ├── index.js
   ├── components/
   ├── hooks/  
   └── utils/
   ```
3. Exportar en `src/games/index.js`:
   ```javascript
   export * as Bingo from './bingo';
   export * as Domino from './domino';
   ```

## Beneficios de esta estructura

- **Modularidad**: Cada juego es independiente
- **Escalabilidad**: Fácil agregar nuevos juegos
- **Mantenibilidad**: Código organizado y fácil de mantener
- **Reutilización**: Componentes y utilidades reutilizables
- **Testing**: Fácil hacer testing de componentes específicos
