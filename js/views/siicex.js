export class SiicexView {
    constructor() {
        this.currentData = null;
        this.isLoading = false;
        this.error = null;
    }

    render() {
        return `
            <div class="siicex-container" style="max-width: 1200px; margin: 0 auto; animation: fade-in 0.3s ease;">
                <!-- Header Component -->
                <div style="text-align: center; margin-bottom: 2rem; padding: 2rem 0;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <span class="material-icons-round" style="font-size: 2.5rem; color: var(--primary-color);">account_balance</span>
                        <h2 style="font-size: 2rem; margin: 0; color: var(--text-main);">Clasificador Aduanero (SIGIV-SIICEX)</h2>
                    </div>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
                        Consulta directa al servidor en vivo de CAAAREM (Siceex).
                    </p>
                </div>

                <!-- Search Component -->
                <div class="card" style="margin-bottom: 2rem; border-top: 4px solid var(--primary-color);">
                    <form id="siicex-search-form" style="display: flex; gap: 1rem;">
                        <div style="flex: 1; position: relative;">
                            <span class="material-icons-round" style="position: absolute; left: 1rem; top: 1rem; color: var(--text-secondary);">search</span>
                            <input type="text" id="siicex-query" class="input" placeholder="Ej. 84713001 o palabra clave..." required 
                                style="width: 100%; padding: 1rem 1rem 1rem 3rem; font-size: 1.1rem; border-radius: var(--radius-md);">
                        </div>
                        <button type="submit" class="btn btn-primary" style="padding: 0 2rem; font-size: 1rem; font-weight: 600;">
                            Consultar Tarifa
                        </button>
                    </form>
                </div>

                <!-- Status & Results Container -->
                <div id="siicex-status" style="display: none; text-align: center; padding: 3rem;">
                    <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
                    <p style="color: var(--text-secondary);" id="siicex-status-text">Conectando al servidor SAT/CAAAREM...</p>
                </div>

                <div id="siicex-results" style="display: none;"></div>
            </div>
        `;
    }

    attachEvents() {
        const form = document.getElementById('siicex-search-form');
        const queryInput = document.getElementById('siicex-query');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = queryInput.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            });
        }
    }

    async performSearch(query) {
        this.isLoading = true;
        this.error = null;
        this.currentData = null;
        this.updateUIState();

        try {
            const response = await fetch(`api/siicex_lite.php?code=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error(`El servidor CAAAREM está caído o bloqueó la conexión (Error HTTP ${response.status}). Intenta más tarde.`);
            }

            const proxyData = await response.json();

            if (proxyData.error) {
                throw new Error(proxyData.error);
            }

            this.currentData = proxyData;

        } catch (err) {
            console.error('[SIGIV-SIICEX] Error:', err);
            this.error = err.message || "Error al conectar con CAAAREM. El servidor puede estar fuera de línea.";
        } finally {
            this.isLoading = false;
            this.updateUIState();
        }
    }

    updateUIState() {
        const statusEl = document.getElementById('siicex-status');
        const resultsEl = document.getElementById('siicex-results');

        if (!statusEl || !resultsEl) return;

        if (this.isLoading) {
            statusEl.style.display = 'block';
            resultsEl.style.display = 'none';
        } else if (this.error) {
            statusEl.style.display = 'none';
            resultsEl.style.display = 'block';
            resultsEl.innerHTML = this.renderError();
        } else if (this.currentData) {
            statusEl.style.display = 'none';
            resultsEl.style.display = 'block';
            resultsEl.innerHTML = this.renderResults();
        }
    }

    renderError() {
        return `
            <div class="card" style="border-left: 4px solid #ef4444; background: #fef2f2;">
                <div style="display: flex; gap: 1rem; align-items: start;">
                    <span class="material-icons-round" style="color: #ef4444; font-size: 2rem;">error_outline</span>
                    <div>
                        <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 0.5rem;">Falla en Servidor CAAAREM</h3>
                        <p style="color: #b91c1c; margin: 0;">${this.error}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderResults() {
        const data = this.currentData;

        if (!data || !data.results || data.results.length === 0) {
            return `
                <div class="card" style="text-align: center; padding: 4rem 2rem;">
                    <span class="material-icons-round" style="font-size: 4rem; color: var(--text-secondary); opacity: 0.5;">search_off</span>
                    <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">Sin resultados</h3>
                    <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
                        El servidor respondió correctamente pero no se encontró la fracción arancelaria registrada.
                    </p>
                </div>
            `;
        }

        const item = data.results[0];

        return `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                <!-- Main Focus Column -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- Title/Description Card -->
                    <div class="card" style="position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--primary-color);"></div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span style="font-size: 0.85rem; font-weight: 600; color: var(--primary-color); letter-spacing: 1px; text-transform: uppercase;">
                                    Fracción Arancelaria (En Vivo)
                                </span>
                                <h2 style="font-size: 2.25rem; font-family: monospace; letter-spacing: 2px; margin: 0.5rem 0;">
                                    ${item.code}
                                </h2>
                            </div>
                            <a href="${data.sourceUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
                                Ver en Servidor <span class="material-icons-round" style="font-size: 1rem; margin-left: 0.2rem;">launch</span>
                            </a>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-body); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                            <h4 style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Descripción oficial:</h4>
                            <p style="color: var(--text-main); font-size: 1.1rem; line-height: 1.5; margin: 0;">
                                ${item.description || 'Descripción no disponible remotamente'}
                            </p>
                        </div>
                    </div>

                    <!-- RRNAs -->
                    <div class="card">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-icons-round" style="color: #eab308;">rule_folder</span>
                                Regulaciones (RRNAs)
                            </h3>
                        </div>
                        ${this.renderRRNAList(item.raw_rrna_snippets)}
                    </div>
                </div>

                <!-- Side Panel (Impuestos) -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <div class="card" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border: none;">
                        <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
                            <span class="material-icons-round" style="color: #38bdf8;">payments</span>
                            Impuestos e IGI
                        </h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.85rem; color: #94a3b8; font-weight: 500;">Impuesto General (IGI)</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">A la Importación / Base</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #38bdf8;">
                                    ${item.arancel_igi || 'Consultar'}
                                </div>
                            </div>
                            
                            <hr style="border: none; border-top: 1px dashed rgba(255,255,255,0.2); margin: 0;">
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.85rem; color: #94a3b8; font-weight: 500;">I.V.A.</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Impuesto al Valor Agregado</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700;">
                                    ${item.iva || 'Consultar'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRRNAList(snippets) {
        if (!snippets || snippets.length === 0) {
            return '<p style="color: var(--text-secondary);">No hay notas registradas / Error al parsear notas vivas.</p>';
        }
        let html = '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">';
        snippets.forEach(s => {
            html += `
                <li style="padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); border-left: 3px solid var(--border-color);">
                    <div style="font-size: 0.95rem; color: var(--text-main); line-height: 1.5;">${s}</div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    }
}
