import { decode, encode } from 'base-64';

export const UNIT_MAP = { 'Un.': 0, 'Kg': 1, 'L': 2, 'Cx': 3, 'G': 4 };
export const REVERSE_UNIT_MAP = { 0: 'Un.', 1: 'Kg', 2: 'L', 3: 'Cx', 4: 'G' };

export const parseRiscaeCode = (content) => {
  if (!content) return null;

  try {
    let base64Part = '';
    
    if (content.includes('data=')) {
      base64Part = content.split('data=')[1].split(/[&\s#]/)[0];
    } else if (content.includes('#RISCAE#')) {
      base64Part = content.split('#RISCAE#')[1].split('#')[0];
    } else {
      return null;
    }

    const rawJson = decode(base64Part);
    const [name, total, itemsArray] = JSON.parse(rawJson);
    
    const importedItems = itemsArray.map(it => ({
      name: it[0],
      unitType: REVERSE_UNIT_MAP[it[1]] || 'Un.',
      amount: it[2],
      price: it[3],
      completed: false
    }));

    return { list: { name, total }, items: importedItems };
  } catch (e) {
    console.error("Erro no parse:", e);
    return null;
  }
};

export const generateRiscaeCode = (data) => {
  return encode(JSON.stringify(data));
};