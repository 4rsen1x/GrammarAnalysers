// Parse BNF grammar into a usable format
function parseGrammar(grammarText) {
  const rules = {};
  const lines = grammarText.trim().split('\n');
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Split the rule into left and right parts
    const parts = line.split(':=');
    if (parts.length !== 2) {
      throw new Error(`Invalid grammar rule: ${line}`);
    }
    
    const nonTerminal = parts[0].trim();
    // Split by | and remove whitespace
    const productions = parts[1].split('|').map(p => p.trim());
    
    // Store the rule
    rules[nonTerminal] = productions;
  }
  
  // Determine the start symbol (first non-terminal in the grammar)
  const startSymbol = Object.keys(rules)[0];
  
  return { rules, startSymbol };
}

// Check if a string is a non-terminal (enclosed in angle brackets)
function isNonTerminal(str) {
  return str.startsWith('<') && str.endsWith('>');
}

// Extract non-terminals and terminals from a production
function tokenizeProduction(production) {
  const tokens = [];
  let currentToken = '';
  let inNonTerminal = false;
  
  for (let i = 0; i < production.length; i++) {
    const char = production[i];
    
    if (char === '<') {
      // Start of a non-terminal
      if (currentToken) {
        // Add any accumulated terminal symbols
        tokens.push({ type: 'terminal', value: currentToken });
        currentToken = '';
      }
      inNonTerminal = true;
      currentToken = char;
    } else if (char === '>' && inNonTerminal) {
      // End of a non-terminal
      currentToken += char;
      tokens.push({ type: 'nonTerminal', value: currentToken });
      currentToken = '';
      inNonTerminal = false;
    } else {
      // Add to current token
      currentToken += char;
    }
  }
  
  // Add any remaining terminal symbols
  if (currentToken) {
    tokens.push({ type: 'terminal', value: currentToken });
  }
  
  return tokens;
}

// Helper function to convert tokens to string for display
function tokensToString(tokens) {
  return tokens.map(token => token.value).join('');
}

// Left-to-right parsing algorithm
function leftRightParse(grammar, inputString) {
  const { rules, startSymbol } = grammar;
  const steps = [];
  
  // Initialize with the start symbol
  let ruleTokens = [{ type: 'nonTerminal', value: startSymbol }];
  let remainingInput = inputString;
  
  // Add initial state
  steps.push({
    ruleString: tokensToString(ruleTokens),
    remainingInput,
    action: 'Начало разбора с аксиомы',
    success: null,
    stepId: 0
  });
  
  // Stack to keep track of backtracking points
  const backtrackStack = [];
  
  // Main parsing loop
  while (ruleTokens.length > 0 && steps.length < 100) { // Limit steps to prevent infinite loops
    const currentToken = ruleTokens[0];
    
    if (currentToken.type === 'nonTerminal') {
      // Current token is a non-terminal, replace it with a production
      if (!rules[currentToken.value]) {
        steps.push({
          ruleString: tokensToString(ruleTokens),
          remainingInput,
          action: `Ошибка: нетерминал ${currentToken.value} не определен в грамматике`,
          success: false,
          stepId: steps.length
        });
        break;
      }
      
      // Get the productions for this non-terminal
      const productions = rules[currentToken.value];
      
      // Save backtracking point
      backtrackStack.push({
        ruleTokens: [...ruleTokens],
        remainingInput,
        nonTerminal: currentToken.value,
        productionIndex: 0,
        productions,
        stepId: steps.length
      });
      
      // Apply the first production
      const newRuleTokens = ruleTokens.slice(1);
      const productionTokens = tokenizeProduction(productions[0]);
      ruleTokens = [...productionTokens, ...newRuleTokens];
      
      steps.push({
        ruleString: tokensToString(ruleTokens),
        remainingInput,
        action: `Заменяем нетерминал ${currentToken.value} на "${productions[0]}"`,
        success: null,
        stepId: steps.length
      });
    } else {
      // Current token is a terminal, match with input
      const terminalValue = currentToken.value;
      
      if (remainingInput.length === 0) {
        // Input is exhausted but we still have terminals to match
        if (backtrackStack.length === 0) {
          steps.push({
            ruleString: tokensToString(ruleTokens),
            remainingInput,
            action: 'Ошибка: входная строка закончилась, но разбор не завершен',
            success: false,
            stepId: steps.length
          });
          break;
        }
        
        // Backtrack
        const backtrackPoint = backtrackStack.pop();
        const { productionIndex, productions } = backtrackPoint;
        
        if (productionIndex < productions.length - 1) {
          // Try the next production
          backtrackPoint.productionIndex++;
          const newRuleTokens = backtrackPoint.ruleTokens.slice(1);
          const productionTokens = tokenizeProduction(productions[productionIndex + 1]);
          ruleTokens = [...productionTokens, ...newRuleTokens];
          remainingInput = backtrackPoint.remainingInput;
          
          backtrackStack.push(backtrackPoint);
          
          steps.push({
            ruleString: tokensToString(ruleTokens),
            remainingInput,
            action: `Возврат: пробуем следующее правило для ${backtrackPoint.nonTerminal}: "${productions[productionIndex + 1]}"`,
            success: null,
            stepId: steps.length,
            backtrackToStep: backtrackPoint.stepId
          });
        } else {
          // No more productions to try
          if (backtrackStack.length === 0) {
            steps.push({
              ruleString: tokensToString(ruleTokens),
              remainingInput,
              action: 'Ошибка: все варианты правил исчерпаны, разбор невозможен',
              success: false,
              stepId: steps.length
            });
            break;
          }
          
          // Continue backtracking
          steps.push({
            ruleString: tokensToString(backtrackPoint.ruleTokens),
            remainingInput: backtrackPoint.remainingInput,
            action: `Возврат: все правила для ${backtrackPoint.nonTerminal} исчерпаны, продолжаем возврат`,
            success: null,
            stepId: steps.length,
            backtrackToStep: backtrackPoint.stepId
          });
        }
      } else if (remainingInput.startsWith(terminalValue)) {
        // Match found, consume the terminal
        ruleTokens = ruleTokens.slice(1);
        remainingInput = remainingInput.substring(terminalValue.length);
        
        steps.push({
          ruleString: tokensToString(ruleTokens),
          remainingInput,
          action: `Символ "${terminalValue}" распознан`,
          success: null,
          stepId: steps.length
        });
        
        // Check if we're done
        if (ruleTokens.length === 0 && remainingInput.length === 0) {
          steps.push({
            ruleString: tokensToString(ruleTokens),
            remainingInput,
            action: 'Разбор успешно завершен! Строка соответствует грамматике.',
            success: true,
            stepId: steps.length
          });
          break;
        } else if (ruleTokens.length === 0 && remainingInput.length > 0) {
          // Rule string is empty but we still have input
          if (backtrackStack.length === 0) {
            steps.push({
              ruleString: tokensToString(ruleTokens),
              remainingInput,
              action: 'Ошибка: правила исчерпаны, но входная строка не полностью обработана',
              success: false,
              stepId: steps.length
            });
            break;
          }
          
          // Backtrack
          const backtrackPoint = backtrackStack.pop();
          const { productionIndex, productions } = backtrackPoint;
          
          if (productionIndex < productions.length - 1) {
            // Try the next production
            backtrackPoint.productionIndex++;
            const newRuleTokens = backtrackPoint.ruleTokens.slice(1);
            const productionTokens = tokenizeProduction(productions[productionIndex + 1]);
            ruleTokens = [...productionTokens, ...newRuleTokens];
            remainingInput = backtrackPoint.remainingInput;
            
            backtrackStack.push(backtrackPoint);
            
            steps.push({
              ruleString: tokensToString(ruleTokens),
              remainingInput,
              action: `Возврат: пробуем следующее правило для ${backtrackPoint.nonTerminal}: "${productions[productionIndex + 1]}"`,
              success: null,
              stepId: steps.length,
              backtrackToStep: backtrackPoint.stepId
            });
          } else {
            // No more productions to try
            if (backtrackStack.length === 0) {
              steps.push({
                ruleString: tokensToString(ruleTokens),
                remainingInput,
                action: 'Ошибка: все варианты правил исчерпаны, разбор невозможен',
                success: false,
                stepId: steps.length
              });
              break;
            }
            
            // Continue backtracking
            steps.push({
              ruleString: tokensToString(backtrackPoint.ruleTokens),
              remainingInput: backtrackPoint.remainingInput,
              action: `Возврат: все правила для ${backtrackPoint.nonTerminal} исчерпаны, продолжаем возврат`,
              success: null,
              stepId: steps.length,
              backtrackToStep: backtrackPoint.stepId
            });
          }
        }
      } else {
        // Mismatch, need to backtrack
        if (backtrackStack.length === 0) {
          steps.push({
            ruleString: tokensToString(ruleTokens),
            remainingInput,
            action: `Ошибка: ожидался символ "${terminalValue}", но получен "${remainingInput[0]}"`,
            success: false,
            stepId: steps.length
          });
          break;
        }
        
        // Backtrack
        const backtrackPoint = backtrackStack.pop();
        const { productionIndex, productions } = backtrackPoint;
        
        if (productionIndex < productions.length - 1) {
          // Try the next production
          backtrackPoint.productionIndex++;
          const newRuleTokens = backtrackPoint.ruleTokens.slice(1);
          const productionTokens = tokenizeProduction(productions[productionIndex + 1]);
          ruleTokens = [...productionTokens, ...newRuleTokens];
          remainingInput = backtrackPoint.remainingInput;
          
          backtrackStack.push(backtrackPoint);
          
          steps.push({
            ruleString: tokensToString(ruleTokens),
            remainingInput,
            action: `Возврат: пробуем следующее правило для ${backtrackPoint.nonTerminal}: "${productions[productionIndex + 1]}"`,
            success: null,
            stepId: steps.length,
            backtrackToStep: backtrackPoint.stepId
          });
        } else {
          // No more productions to try
          if (backtrackStack.length === 0) {
            steps.push({
              ruleString: tokensToString(ruleTokens),
              remainingInput,
              action: 'Ошибка: все варианты правил исчерпаны, разбор невозможен',
              success: false,
              stepId: steps.length
            });
            break;
          }
          
          // Continue backtracking
          steps.push({
            ruleString: tokensToString(backtrackPoint.ruleTokens),
            remainingInput: backtrackPoint.remainingInput,
            action: `Возврат: все правила для ${backtrackPoint.nonTerminal} исчерпаны, продолжаем возврат`,
            success: null,
            stepId: steps.length,
            backtrackToStep: backtrackPoint.stepId
          });
        }
      }
    }
  }
  
  return steps;
}

// Render the parsing steps
function renderParsingSteps(steps) {
  let html = '';
  
  steps.forEach((step, index) => {
    const stepClass = step.backtrackToStep !== undefined ? 'parsing-step backtrack-step' : 'parsing-step';
    html += `<div class="${stepClass}" id="step-${step.stepId}">`;
    html += `<div class="step-header">Шаг ${index + 1}: ${step.action}</div>`;
    
    // Add backtrack reference if applicable
    if (step.backtrackToStep !== undefined) {
      html += `<div class="backtrack-ref">Возврат к шагу ${step.backtrackToStep + 1} <a href="#step-${step.backtrackToStep}" class="backtrack-link">(перейти)</a></div>`;
    }
    
    // Render rule string
    html += `<div class="rule-string">Строка правил: `;
    if (!step.ruleString || step.ruleString.length === 0) {
      html += '<span class="processed">[пусто]</span>';
    } else {
      html += `<span>${step.ruleString}</span>`;
    }
    html += `</div>`;
    
    // Render input string
    html += `<div class="input-string">Входная строка: `;
    if (!step.remainingInput || step.remainingInput.length === 0) {
      html += '<span class="processed">[пусто]</span>';
    } else {
      html += `<span>${step.remainingInput}</span>`;
    }
    html += `</div>`;
    
    // Show success/failure message
    if (step.success === true) {
      html += `<div class="success">Успех: строка соответствует грамматике</div>`;
    } else if (step.success === false) {
      html += `<div class="failure">Ошибка: строка не соответствует грамматике</div>`;
    }
    
    html += `</div>`;
  });
  
  return html;
}

// Export the functions
window.leftright = {
  parseGrammar,
  leftRightParse,
  renderParsingSteps
};