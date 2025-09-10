// Mapping de cartas UNO a assets de imagen
// Convenciones de nombres de archivos en src/images/card_decks/uno:
// numeros: `${value}-${color}.png` (0-9, colores: rojo, amarillo, verde, azul)
// +2: `plus2-${color}.png`
// reverse: `swap-${color}.png`
// skip: `cancel-${color}.png` (nota: hay una variante cancel_azul con guion bajo; cubrimos ambas)
// +4: `plus4.png`
// wild: `change-color.png`
// dorso: `back.png` (reemplaza empty.png)

const base = require("../../../../assets/images/card_decks/uno/back.png"); // dorso oficial

const plus4 = require("../../../../assets/images/card_decks/uno/plus4.png");
const wild = require("../../../../assets/images/card_decks/uno/change-color.png");

// Metro no soporta require con template dinámico: declaramos un mapa estático.
const numberCards = {
  rojo: {
    0: require("../../../../assets/images/card_decks/uno/0-rojo.png"),
    1: require("../../../../assets/images/card_decks/uno/1-rojo.png"),
    2: require("../../../../assets/images/card_decks/uno/2-rojo.png"),
    3: require("../../../../assets/images/card_decks/uno/3-rojo.png"),
    4: require("../../../../assets/images/card_decks/uno/4-rojo.png"),
    5: require("../../../../assets/images/card_decks/uno/5-rojo.png"),
    6: require("../../../../assets/images/card_decks/uno/6-rojo.png"),
    7: require("../../../../assets/images/card_decks/uno/7-rojo.png"),
    8: require("../../../../assets/images/card_decks/uno/8-rojo.png"),
    9: require("../../../../assets/images/card_decks/uno/9-rojo.png"),
  },
  amarillo: {
    0: require("../../../../assets/images/card_decks/uno/0-amarillo.png"),
    1: require("../../../../assets/images/card_decks/uno/1-amarillo.png"),
    2: require("../../../../assets/images/card_decks/uno/2-amarillo.png"),
    3: require("../../../../assets/images/card_decks/uno/3-amarillo.png"),
    4: require("../../../../assets/images/card_decks/uno/4-amarillo.png"),
    5: require("../../../../assets/images/card_decks/uno/5-amarillo.png"),
    6: require("../../../../assets/images/card_decks/uno/6-amarillo.png"),
    7: require("../../../../assets/images/card_decks/uno/7-amarillo.png"),
    8: require("../../../../assets/images/card_decks/uno/8-amarillo.png"),
    9: require("../../../../assets/images/card_decks/uno/9-amarillo.png"),
  },
  verde: {
    0: require("../../../../assets/images/card_decks/uno/0-verde.png"),
    1: require("../../../../assets/images/card_decks/uno/1-verde.png"),
    2: require("../../../../assets/images/card_decks/uno/2-verde.png"),
    3: require("../../../../assets/images/card_decks/uno/3-verde.png"),
    4: require("../../../../assets/images/card_decks/uno/4-verde.png"),
    5: require("../../../../assets/images/card_decks/uno/5-verde.png"),
    6: require("../../../../assets/images/card_decks/uno/6-verde.png"),
    7: require("../../../../assets/images/card_decks/uno/7-verde.png"),
    8: require("../../../../assets/images/card_decks/uno/8-verde.png"),
    9: require("../../../../assets/images/card_decks/uno/9-verde.png"),
  },
  azul: {
    0: require("../../../../assets/images/card_decks/uno/0-azul.png"),
    1: require("../../../../assets/images/card_decks/uno/1-azul.png"),
    2: require("../../../../assets/images/card_decks/uno/2-azul.png"),
    3: require("../../../../assets/images/card_decks/uno/3-azul.png"),
    4: require("../../../../assets/images/card_decks/uno/4-azul.png"),
    5: require("../../../../assets/images/card_decks/uno/5-azul.png"),
    6: require("../../../../assets/images/card_decks/uno/6-azul.png"),
    7: require("../../../../assets/images/card_decks/uno/7-azul.png"),
    8: require("../../../../assets/images/card_decks/uno/8-azul.png"),
    9: require("../../../../assets/images/card_decks/uno/9-azul.png"),
  },
};

const plus2Cards = {
  rojo: require("../../../../assets/images/card_decks/uno/plus2-rojo.png"),
  amarillo: require("../../../../assets/images/card_decks/uno/plus2-amarillo.png"),
  verde: require("../../../../assets/images/card_decks/uno/plus2-verde.png"),
  azul: require("../../../../assets/images/card_decks/uno/plus2-azul.png"),
};

const reverseCards = {
  rojo: require("../../../../assets/images/card_decks/uno/swap-rojo.png"),
  amarillo: require("../../../../assets/images/card_decks/uno/swap-amarillo.png"),
  verde: require("../../../../assets/images/card_decks/uno/swap-verde.png"),
  azul: require("../../../../assets/images/card_decks/uno/swap-azul.png"),
};

const skipCards = {
  rojo: require("../../../../assets/images/card_decks/uno/cancel-rojo.png"),
  amarillo: require("../../../../assets/images/card_decks/uno/cancel-amarillo.png"),
  verde: require("../../../../assets/images/card_decks/uno/cancel-verde.png"),
  azul: require("../../../../assets/images/card_decks/uno/cancel-azul.png"), // confirmado nombre con guion
};

export function getUnoCardImage(card) {
  if (!card) return base;
  const { kind, color, value } = card;
  if (kind === "number") {
    const c = mapColor(color);
    return (numberCards[c] && numberCards[c][value]) || base;
  }
  if (kind === "draw2") {
    const c = mapColor(color);
    return plus2Cards[c] || base;
  }
  if (kind === "reverse") {
    const c = mapColor(color);
    return reverseCards[c] || base;
  }
  if (kind === "skip") {
    const c = mapColor(color);
    return skipCards[c] || base;
  }
  if (kind === "wild_draw4") return plus4;
  if (kind === "wild") return wild;
  return base;
}

export function getUnoBackImage() {
  return base;
}

export function getUnoDeckStackImages(count = 3) {
  const imgs = [];
  for (let i = 0; i < Math.min(count, 3); i++) imgs.push(base);
  return imgs;
}

// El backend probablemente usa english colors: red, yellow, green, blue
function mapColor(c) {
  switch (c) {
    case "red":
      return "rojo";
    case "yellow":
      return "amarillo";
    case "green":
      return "verde";
    case "blue":
      return "azul";
    default:
      return c; // ya local?
  }
}
