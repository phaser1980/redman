export function validateSymbol(symbol: number): boolean {
  return symbol >= 1 && symbol <= 4;
}

export function getSymbolName(symbol: number): string {
  switch (symbol) {
    case 1: return '♥';
    case 2: return '♦';
    case 3: return '♣';
    case 4: return '♠';
    default: throw new Error('Invalid symbol');
  }
}

export function validateStudentId(studentId: number): boolean {
  // These are our known valid student IDs
  const validIds = [1, 2, 5, 10, 100, 200];
  return validIds.includes(studentId);
}
