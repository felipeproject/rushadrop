// js/configGlobal.js

const DIAS = ['DAY1', 'DAY2', 'DAY3', 'DAY4'];
const MAPAS_POR_DIA = [
  ['Erangel', 'Taego', 'Miramar'],
  ['Deston', 'Vikendi', 'Erangel'],
  ['Sanhok', 'Rondo', 'Taego'],
  ['Deston', 'Erangel', 'Miramar']
];

export const rodadas = Object.fromEntries(
  DIAS.map((dia, i) => [
    dia,
    Array.from({ length: 3 }, (_, j) => `csv/${dia}/jogo${j + 1}.csv`)
  ])
);

export const mapas = Object.fromEntries(
  DIAS.map((dia, i) => [dia, MAPAS_POR_DIA[i]])
);

export const PONTOS_POR_COLOCACAO = {
  1: 15, 2: 12, 3: 10, 4: 8,
  5: 6, 6: 4, 7: 2
};

// Se quiser usar DIAS e MAPAS_POR_DIA diretamente:
export { DIAS, MAPAS_POR_DIA };
