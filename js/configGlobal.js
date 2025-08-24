// js/configGlobal.js

// Dias do campeonato
export const DIAS = ['DIA1', 'DIA2', 'DIA3', 'DIA4'];

// Mapas por dia
export const MAPAS_POR_DIA = [
  ['Erangel', 'Taego', 'Miramar'],
  ['Vikendi', 'Erangel', 'Deston'],
  ['Sanhok', 'Rondo', 'Taego'],
  ['Deston', 'Erangel', 'Miramar']
];

// CSV por dia e jogo
export const rodadas = Object.fromEntries(
  DIAS.map((dia, i) => [
    dia,
    MAPAS_POR_DIA[i].map((_, j) => `csv/${dia}/jogo${j + 1}.csv`)
  ])
);

// Pontuação por colocação
export const PONTOS_POR_COLOCACAO = { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2 };

// Pontos adicionais
export const PONTOS_ADICIONAIS = { kill: 1, participacao: 1 };

