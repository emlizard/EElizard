// Vacuum permeability (H/m)
    const MU_0 = 4 * Math.PI * 1e-7;

    // Theme toggle functionality
    function toggleTheme() {
      const html = document.documentElement;
      const themeIcon = document.getElementById('theme-icon');
      const currentTheme = html.getAttribute('data-theme');
      
      if (currentTheme === 'light') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
      } else {
        html.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
      }
    }

    function showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }

    function calculate() {
      const resultsContainer = document.getElementById('results');
      
      // Show loading state
      resultsContainer.innerHTML = '<div class="calculating">Calculating core parameters...</div>';
      
      setTimeout(() => {
        try {
          const dimA = parseFloat(document.getElementById("dimA").value);
          const dimH = parseFloat(document.getElementById("dimH").value);
          const dimC = parseFloat(document.getElementById("dimC").value);
          const tSide = parseFloat(document.getElementById("tSide").value);
          const tPlate = parseFloat(document.getElementById("tPlate").value);
          const dimF = parseFloat(document.getElementById("dimF").value);
          const dimG = parseFloat(document.getElementById("dimG").value);
          const legType = document.getElementById("legType").value;
          const muR = parseFloat(document.getElementById("muR").value);
          const gap = parseFloat(document.getElementById("gap").value);
          const turns = parseInt(document.getElementById("turns").value);

          // Calculate derived dimensions
          const dimB = dimH / 2;
          const dimE = dimA - 2 * tSide;
          const dimD = dimB - tPlate;

          // Input validation
          if ([dimA,dimH,dimC,tSide,tPlate,dimF,dimG,muR,turns].some(v=>isNaN(v)||v<=0) || isNaN(gap)) {
            showError('All values must be positive numbers (gap can be 0)');
            resultsContainer.innerHTML = '<div class="placeholder-state">Invalid input parameters</div>';
            return;
          }
          
          if (dimB <= 0 || dimE <= 0 || dimD <= 0) {
            showError('Invalid geometry: Check t_side and t_plate values');
            resultsContainer.innerHTML = '<div class="placeholder-state">Invalid geometry constraints</div>';
            return;
          }
          
          if (dimH <= 2*tPlate || dimA <= 2*tPlate) {
            showError('H > 2*t_plate and A > 2*t_plate conditions must be satisfied');
            resultsContainer.innerHTML = '<div class="placeholder-state">Invalid geometry constraints</div>';
            return;
          }

          const h = tPlate;
          const p = (dimA - dimE)/2;
          const A1 = p*dimC;
          const A2 = h*dimC;
          const A3 = legType==="round"
                     ? Math.PI*(dimF/2)**2/2
                     : (dimF*dimG)/2;
          const A4 = (A1+A2)/2;
          const A5 = (A2+A3)/2;

          const l1=dimD, l2=(dimE-dimF)/2, l3=dimD;
          const l4=Math.PI/8*(p+h);
          const l5=Math.PI/8*((legType==="round"?0.5959*dimF+h:dimF/2+h));

          const C1 = l1/A1 + l2/A2 + l3/A3 + l4/A4 + l5/A5;
          const C2 = 0.5*(l1/A1**2 + l2/A2**2 + l3/A3**2 + l4/A4**2 + l5/A5**2);

          const Le_mm = C1**2/C2;
          const Ae_mm2 = C1/C2;
          const Ve_mm3 = C1**3/C2**2;

          const Le = Le_mm*1e-3;
          const Ae = Ae_mm2*1e-6;
          const gap_m = gap*1e-3;
          const muE = muR/(1+gap_m*muR/Le);

          const L_H = MU_0*muE*turns**2*(Ae/Le);
          const L_uH = L_H*1e6;
          const B_T = (MU_0*muE*turns*1)/Le;
          const B_mT = B_T*1e3;

          // Display results
          let html = `
            <div class="result-display">
              <div class="result-title">
                <i class="fas fa-check-circle"></i>
                Core Design Results
              </div>
              <div class="result-grid">
          `;

          const results = [
            { label: 'Effective Path Length (Lₑ)', value: `${Le_mm.toFixed(3)} mm` },
            { label: 'Effective Area (Aₑ)', value: `${Ae_mm2.toFixed(3)} mm²` },
            { label: 'Effective Volume (Vₑ)', value: `${Ve_mm3.toFixed(3)} mm³` },
            { label: 'Effective Permeability (μₑ)', value: muE.toFixed(2) },
            { label: 'Inductance (L)', value: `${L_uH.toFixed(2)} μH` },
            { label: 'Flux Density (B @1A)', value: `${B_mT.toFixed(2)} mT` }
          ];

          results.forEach(result => {
            html += `
              <div class="result-item">
                <div class="result-label">${result.label}</div>
                <div class="result-value updated">${result.value}</div>
              </div>
            `;
          });

          html += `
              </div>
            </div>
          `;

          resultsContainer.innerHTML = html;
          resultsContainer.className = 'animate-in';
          
          // Re-render MathJax if needed
          if (window.MathJax) {
            MathJax.typeset();
          }
        } catch (error) {
          showError(`Calculation error: ${error.message}`);
          resultsContainer.innerHTML = '<div class="placeholder-state">Calculation failed. Please check your input values.</div>';
        }
      }, 600);
    }

    // Initialize with default calculation
    document.addEventListener('DOMContentLoaded', function() {
      calculate();
    });