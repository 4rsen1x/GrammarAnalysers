// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show the selected tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
  
  // Rutishauser parser form
  const expressionForm = document.getElementById('expression-form');
  const tableContainer = document.getElementById('table-container');
  
  expressionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const expressionInput = document.getElementById('expression-input');
    const expr = expressionInput.value.trim();
    
    if (!expr) return;
    
    try {
      const steps = window.rutishauser.parseRutishauser(expr);
      
      if (steps[0].error) {
        tableContainer.innerHTML = `<div class="error">${steps[0].error}</div>`;
      } else {
        tableContainer.innerHTML = window.rutishauser.renderTable(steps);
      }
    } catch (error) {
      tableContainer.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
    }
  });
  
  // Left-to-right parser form
  const leftrightForm = document.getElementById('leftright-form');
  const leftrightResult = document.getElementById('leftright-result');
  
  leftrightForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const grammarInput = document.getElementById('grammar-input');
    const stringInput = document.getElementById('string-input');
    
    const grammarText = grammarInput.value.trim();
    const inputString = stringInput.value.trim();
    
    if (!grammarText || !inputString) {
      leftrightResult.innerHTML = `<div class="error">Пожалуйста, введите грамматику и строку для разбора</div>`;
      return;
    }
    
    try {
      const grammar = window.leftright.parseGrammar(grammarText);
      const steps = window.leftright.leftRightParse(grammar, inputString);
      leftrightResult.innerHTML = window.leftright.renderParsingSteps(steps);
    } catch (error) {
      leftrightResult.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
    }
  });
  
  // Bottom-up parser form
  const bottomupForm = document.getElementById('bottomup-form');
  const bottomupResult = document.getElementById('bottomup-result');
  
  bottomupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const grammarInput = document.getElementById('bottomup-grammar');
    const stringInput = document.getElementById('bottomup-input');
    
    const grammarText = grammarInput.value.trim();
    const inputString = stringInput.value.trim();
    
    if (!grammarText || !inputString) {
      bottomupResult.innerHTML = `<div class="error">Пожалуйста, введите грамматику и строку для разбора</div>`;
      return;
    }
    
    try {
      const grammar = window.bottomup.parseGrammar(grammarText);
      const steps = window.bottomup.bottomUpParse(grammar, inputString);
      bottomupResult.innerHTML = window.bottomup.renderParsingSteps(steps);
    } catch (error) {
      bottomupResult.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
    }
  });
  
  // LL(k) parser form code removed
  
  // Set default grammar examples
  document.getElementById('grammar-input').value = '<Целое> := <Знак><ЦБЗ> | <ЦБЗ>\n<ЦБЗ> := <Цифра><ЦБЗ> | <Цифра>\n<Цифра> := 0|1|2|3|4|5|6|7|8|9\n<Знак> := +|-';
  document.getElementById('bottomup-grammar').value = '<S> := <A><B>\n<A> := a<A> | a\n<B> := b<B> | b';
  // LL(k) grammar example removed
});

// Polish notation parser form code removed