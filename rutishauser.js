// --- Парсер Рутисхаузера ---
function parseRutishauser(expr) {
  // Удаляем пробелы для простоты
  const S = expr.replace(/\s+/g, '');
  const steps = [];
  let N = [0];
  let J = 1;
  let S_arr = S.split('');
  let triples = [];
  let tempVars = [];
  let currentS = S_arr.slice();
  let currentN = [0];

  // Функция для проверки операнда (буква или цифра)
  function isOperand(ch) {
    return /[a-zA-Z0-9]/.test(ch);
  }

  // --- Новый алгоритм вычисления N ---
  let depth = 0;
  N = [0];
  let error = null;
  for (let i = 0; i < S_arr.length; i++) {
    const ch = S_arr[i];
    if (ch === '(') {
      depth++;
      N.push(depth);
    } else if (ch === ')') {
      N.push(depth);
      depth--;
      if (depth < 0) error = 'Лишняя закрывающая скобка';
    } else if (isOperand(ch)) {
      N.push(depth + 1);
    } else if ('+-*/'.includes(ch)) {
      N.push(depth);
    } else {
      error = `Недопустимый символ: ${ch}`;
      N.push(depth);
    }
  }
  if (depth !== 0 && !error) error = 'Несбалансированные скобки';
  // Удаляем первый элемент (он всегда 0, для выравнивания с S)
  N = N.slice(1);

  // Сохраняем первый шаг
  steps.push({
    S: S_arr.slice(),
    N: N.slice(),
    triple: ''
  });

  // Если есть ошибка, возвращаем только первый шаг с ошибкой
  if (error) {
    steps[0].error = error;
    return steps;
  }

  // --- Генерация троек и шагов ---
  let stepNum = 1;
  let tempIdx = 1;
  let workingS = S_arr.slice();
  let workingN = N.slice();
  while (true) {
    // 1. Находим максимальный индекс k
    let maxN = Math.max(...workingN);
    if (maxN === 0) break;
    // 2. Ищем подстроку вида k(k-1)k или (k-1)k(k-1)k(k-1) (с учётом скобок)
    let found = false;
    let opIdx = -1;
    // Сначала ищем k(k-1)k (без скобок)
    for (let i = 1; i < workingN.length - 1; i++) {
      if (
        workingN[i - 1] === maxN &&
        workingN[i] === maxN - 1 &&
        workingN[i + 1] === maxN
      ) {
        // Проверяем, что по центру операция
        if (["+", "-", "*", "/"].includes(workingS[i])) {
          opIdx = i;
          found = true;
          break;
        }
      }
    }
    // Если не нашли, ищем вариант со скобками: (k-1)k(k-1)k(k-1)
    if (!found) {
      for (let i = 2; i < workingN.length - 2; i++) {
        if (
          workingS[i - 2] === "(" &&
          workingN[i - 2] === maxN - 1 &&
          workingN[i - 1] === maxN &&
          ["+", "-", "*", "/"].includes(workingS[i]) &&
          workingN[i + 1] === maxN &&
          workingS[i + 2] === ")" &&
          workingN[i + 2] === maxN - 1
        ) {
          opIdx = i;
          found = true;
          break;
        }
      }
    }
    if (!found) break; // Нет подходящей подстроки
    // Формируем тройку
    let leftIdx = opIdx - 1;
    let rightIdx = opIdx + 1;
    let left = workingS[leftIdx];
    let right = workingS[rightIdx];
    let op = workingS[opIdx];
    let T = `T${tempIdx}`;
    let triple = `${T}=${left}${op}${right}`;
    triples.push(triple);
    tempVars.push(T);
    // 3. Удаляем обработанные символы и скобки, заменяем на временную переменную с индексом n=k-1
    // Проверяем, есть ли скобки вокруг
    let l = leftIdx, r = rightIdx;
    if (
      leftIdx - 1 >= 0 && rightIdx + 1 < workingS.length &&
      workingS[leftIdx - 1] === "(" && workingS[rightIdx + 1] === ")"
    ) {
      l = leftIdx - 1;
      r = rightIdx + 1;
    }
    workingS.splice(l, r - l + 1, T);
    workingN.splice(l, r - l + 1, maxN - 1);
    // 4. Сохраняем шаг
    steps.push({
      S: workingS.slice(),
      N: workingN.slice(),
      triple
    });
    tempIdx++;
  }
  return steps;
}

function renderTable(steps) {
  if (!steps.length) return '';
  let html = '<table><thead><tr><th>№ шага</th><th>Строка / Индексы</th><th>Тройка</th></tr></thead><tbody>';
  steps.forEach((step, i) => {
    html += '<tr>';
    html += `<td>${i+1}</td>`;
    html += '<td>';
    html += `<div class='expr-row'>S: ${step.S.join(' ')}</div>`;
    html += `<div class='expr-row'>N: ${step.N.map((n, idx) => typeof n==='number'?n:'').join(' ')}</div>`;
    html += '</td>';
    html += `<td>${step.triple||''}</td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

// Export the functions
window.rutishauser = {
  parseRutishauser,
  renderTable
};