// --- Левосторонний восходящий разбор ---

// Функция для разбора грамматики
function parseGrammar(grammarText) {
  const rules = {};
  const lines = grammarText.trim().split('\n');
  
  for (const line of lines) {
    // Пропускаем пустые строки
    if (!line.trim()) continue;
    
    // Разделяем правило на левую и правую части
    const parts = line.split(':=');
    if (parts.length !== 2) {
      throw new Error(`Некорректное правило грамматики: ${line}`);
    }
    
    const nonTerminal = parts[0].trim();
    // Разделяем по | и удаляем пробелы
    const productions = parts[1].split('|').map(p => p.trim());
    
    // Сохраняем правило
    rules[nonTerminal] = productions;
  }
  
  // Определяем аксиому (первый нетерминал в грамматике)
  const startSymbol = Object.keys(rules)[0];
  
  return { rules, startSymbol };
}

// Функция для проверки, является ли строка нетерминалом
function isNonTerminal(str) {
  return str.startsWith('<') && str.endsWith('>');
}

// Функция для токенизации строки
function tokenizeString(inputString) {
  const tokens = [];
  let currentToken = '';
  let inNonTerminal = false;
  
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString[i];
    
    if (char === '<') {
      // Начало нетерминала
      if (currentToken) {
        // Добавляем накопленные терминальные символы
        for (const c of currentToken) {
          tokens.push({ type: 'terminal', value: c });
        }
        currentToken = '';
      }
      inNonTerminal = true;
      currentToken = char;
    } else if (char === '>' && inNonTerminal) {
      // Конец нетерминала
      currentToken += char;
      tokens.push({ type: 'nonTerminal', value: currentToken });
      currentToken = '';
      inNonTerminal = false;
    } else {
      // Добавляем к текущему токену
      currentToken += char;
    }
  }
  
  // Добавляем оставшиеся терминальные символы
  if (currentToken) {
    for (const c of currentToken) {
      tokens.push({ type: 'terminal', value: c });
    }
  }
  
  return tokens;
}

// Функция для токенизации продукции
function tokenizeProduction(production) {
  const tokens = [];
  let currentToken = '';
  let inNonTerminal = false;
  
  for (let i = 0; i < production.length; i++) {
    const char = production[i];
    
    if (char === '<') {
      // Начало нетерминала
      if (currentToken) {
        // Добавляем накопленные терминальные символы
        for (const c of currentToken) {
          tokens.push({ type: 'terminal', value: c });
        }
        currentToken = '';
      }
      inNonTerminal = true;
      currentToken = char;
    } else if (char === '>' && inNonTerminal) {
      // Конец нетерминала
      currentToken += char;
      tokens.push({ type: 'nonTerminal', value: currentToken });
      currentToken = '';
      inNonTerminal = false;
    } else {
      // Добавляем к текущему токену
      currentToken += char;
    }
  }
  
  // Добавляем оставшиеся терминальные символы
  if (currentToken) {
    for (const c of currentToken) {
      tokens.push({ type: 'terminal', value: c });
    }
  }
  
  return tokens;
}

// Функция для преобразования токенов в строку
function tokensToString(tokens) {
  return tokens.map(token => token.value).join('');
}

// Функция для поиска всех возможных сверток в строке
function findReductions(tokens, rules) {
  const reductions = [];
  
  // Перебираем все правила
  for (const [nonTerminal, productions] of Object.entries(rules)) {
    // Перебираем все продукции правила
    for (const production of productions) {
      // Токенизируем продукцию
      const productionTokens = tokenizeProduction(production);
      
      // Ищем все вхождения продукции в строке
      for (let i = 0; i <= tokens.length - productionTokens.length; i++) {
        let match = true;
        
        // Проверяем, совпадает ли подстрока с продукцией
        for (let j = 0; j < productionTokens.length; j++) {
          if (tokens[i + j].value !== productionTokens[j].value) {
            match = false;
            break;
          }
        }
        
        if (match) {
          reductions.push({
            startIndex: i,
            endIndex: i + productionTokens.length - 1,
            nonTerminal,
            production,
            productionTokens
          });
        }
      }
    }
  }
  
  return reductions;
}

// Функция для проверки, соответствует ли терминал правилу
function matchesTerminalRule(terminal, rule) {
  // Проверяем, содержит ли правило этот терминал
  return rule.split('|').some(option => option.trim() === terminal);
}

// Основная функция левостороннего восходящего разбора
function bottomUpParse(grammar, inputString) {
  const steps = [];
  let stepId = 0;
  let tokens = tokenizeString(inputString);
  let success = null;
  let backtrackStack = [];
  
  // Функция для создания шага
  function createStep(action, tokens, reductions = [], selectedReduction = null, backtrackToStep = undefined) {
    const step = {
      stepId: stepId++,
      action,
      tokens: [...tokens],
      inputString: tokensToString(tokens),
      reductions,
      selectedReduction,
      backtrackToStep,
      success
    };
    steps.push(step);
    return step;
  }
  
  // Начальный шаг
  createStep('Начало разбора', tokens);
  
  // Предварительная обработка: заменяем терминалы на нетерминалы согласно правилам
  let preprocessingDone = false;
  while (!preprocessingDone) {
    preprocessingDone = true;
    
    // Обрабатываем каждый терминальный символ
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'terminal') {
        // Проверяем все правила для терминалов
        for (const [nonTerminal, productions] of Object.entries(grammar.rules)) {
          for (const production of productions) {
            // Если продукция - это просто терминал (без нетерминалов)
            if (!production.includes('<') && !production.includes('>')) {
              const options = production.split('|');
              for (const option of options) {
                if (option.trim() === token.value) {
                  // Заменяем терминал на нетерминал
                  tokens[i] = { type: 'nonTerminal', value: nonTerminal };
                  createStep(`Замена терминала '${token.value}' на нетерминал ${nonTerminal}`, tokens);
                  preprocessingDone = false;
                  break;
                }
              }
              if (!preprocessingDone) break;
            }
          }
          if (!preprocessingDone) break;
        }
      }
      
      if (!preprocessingDone) break;
    }
  }
  
  // Основной цикл разбора
  while (success === null) {
    // Находим все возможные свертки
    const reductions = findReductions(tokens, grammar.rules);
    
    if (tokens.length === 1 && tokens[0].value === grammar.startSymbol) {
      // Успех: получили аксиому
      success = true;
      createStep('Успешное завершение разбора', tokens, reductions);
      break;
    }
    
    if (reductions.length === 0) {
      // Нет возможных сверток
      if (backtrackStack.length === 0) {
        // Нет возможности отката - ошибка
        success = false;
        createStep('Ошибка: нет возможных сверток и вариантов отката', tokens);
        break;
      } else {
        // Выполняем откат
        const backtrackPoint = backtrackStack.pop();
        tokens = backtrackPoint.tokens;
        const backtrackStep = createStep(
          'Откат к предыдущему шагу с альтернативными свертками',
          tokens,
          backtrackPoint.reductions,
          null,
          backtrackPoint.stepId
        );
        
        // Выбираем следующую свертку
        const nextReduction = backtrackPoint.reductions[backtrackPoint.nextReductionIndex];
        
        // Применяем свертку
        const newTokens = [...tokens];
        newTokens.splice(
          nextReduction.startIndex,
          nextReduction.endIndex - nextReduction.startIndex + 1,
          { type: 'nonTerminal', value: nextReduction.nonTerminal }
        );
        
        // Сохраняем оставшиеся свертки для возможного отката
        if (backtrackPoint.nextReductionIndex < backtrackPoint.reductions.length - 1) {
          backtrackStack.push({
            tokens: [...tokens],
            reductions: backtrackPoint.reductions,
            nextReductionIndex: backtrackPoint.nextReductionIndex + 1,
            stepId: backtrackStep.stepId
          });
        }
        
        tokens = newTokens;
        createStep(
          `Применение свертки: ${nextReduction.production} -> ${nextReduction.nonTerminal}`,
          tokens,
          reductions,
          nextReduction
        );
      }
    } else {
      // Есть возможные свертки, выбираем первую (самую левую)
      const reduction = reductions[0];
      
      // Если есть альтернативные свертки, сохраняем точку отката
      if (reductions.length > 1) {
        backtrackStack.push({
          tokens: [...tokens],
          reductions,
          nextReductionIndex: 1,
          stepId: steps.length - 1
        });
      }
      
      // Применяем свертку
      const newTokens = [...tokens];
      newTokens.splice(
        reduction.startIndex,
        reduction.endIndex - reduction.startIndex + 1,
        { type: 'nonTerminal', value: reduction.nonTerminal }
      );
      
      tokens = newTokens;
      createStep(
        `Применение свертки: ${reduction.production} -> ${reduction.nonTerminal}`,
        tokens,
        reductions,
        reduction
      );
    }
  }
  
  return steps;
}

// Функция для отображения шагов разбора
function renderParsingSteps(steps) {
  let html = '';
  
  steps.forEach((step, index) => {
    const stepClass = step.backtrackToStep !== undefined ? 'parsing-step backtrack-step' : 'parsing-step';
    html += `<div class="${stepClass}" id="step-${step.stepId}">`;
    html += `<div class="step-header">Шаг ${index + 1}: ${step.action}</div>`;
    
    // Добавляем ссылку на шаг отката, если применимо
    if (step.backtrackToStep !== undefined) {
      html += `<div class="backtrack-ref">Возврат к шагу ${step.backtrackToStep + 1} <a href="#step-${step.backtrackToStep}" class="backtrack-link">(перейти)</a></div>`;
    }
    
    // Отображаем текущую строку
    html += `<div class="input-string">Текущая строка: ${step.inputString}</div>`;
    
    // Отображаем возможные свертки
    if (step.reductions && step.reductions.length > 0) {
      html += `<div class="reductions">Возможные свертки:`;
      html += `<ul>`;
      step.reductions.forEach((reduction, i) => {
        const isSelected = step.selectedReduction && 
                          reduction.startIndex === step.selectedReduction.startIndex && 
                          reduction.nonTerminal === step.selectedReduction.nonTerminal;
        const className = isSelected ? 'selected-reduction' : '';
        html += `<li class="${className}">
          ${reduction.production} -> ${reduction.nonTerminal} 
          (позиция ${reduction.startIndex + 1}-${reduction.endIndex + 1})
        </li>`;
      });
      html += `</ul></div>`;
    }
    
    // Показываем сообщение об успехе/ошибке
    if (step.success === true) {
      html += `<div class="success">Успех: строка соответствует грамматике</div>`;
    } else if (step.success === false) {
      html += `<div class="failure">Ошибка: строка не соответствует грамматике</div>`;
    }
    
    html += `</div>`;
  });
  
  return html;
}

// Экспортируем функции
window.bottomup = {
  parseGrammar,
  bottomUpParse,
  renderParsingSteps
};