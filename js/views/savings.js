export class SavingsView {
    constructor(store) {
        this.store = store;
        this.projects = [];
    }

    render() {
        // Fetch Data
        this.projects = this.store.getAll('savingsProjects') || [];
        const allEntries = this.store.getAll('savingsEntries') || [];

        // Calculate Metrics
        const totalProjects = this.projects.length;
        const totalEstimated = this.projects.reduce((acc, p) => acc + (Number(p.estimatedSavings) || 0), 0);
        const totalRealized = allEntries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

        let compliance = 0;
        if (totalEstimated > 0) {
            compliance = (totalRealized / totalEstimated) * 100;
        }

        return `
            <div class="savings-container" style="padding: 1.5rem; height: calc(100vh - 70px); overflow-y: hidden; display: flex; flex-direction: column;">
                
                <!-- Dashboard Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.75rem;">Proyectos de Ahorro</h2>
                        <p style="margin: 0.25rem 0 0; color: var(--text-secondary);">Tablero de control y seguimiento de iniciativas</p>
                    </div>
                    <button id="btn-new-project" class="btn btn-primary" style="box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                        <span class="material-icons-round">add</span>
                        Nuevo Proyecto
                    </button>
                </div>

                <!-- KPI Cards -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                    
                    <!-- Total Projects -->
                    <div style="background: white; padding: 1.25rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                            <div style="padding: 0.5rem; background: #f1f5f9; border-radius: 8px; display: flex;">
                                <span class="material-icons-round" style="color: #64748b; font-size: 1.25rem;">folder</span>
                            </div>
                            <span style="font-size: 0.875rem; font-weight: 500;">Proyectos Totales</span>
                        </div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-main);">${totalProjects}</div>
                        <div style="font-size: 0.75rem; color: var(--status-ordered); margin-top: 0.25rem;">
                            En curso y finalizados
                        </div>
                    </div>

                    <!-- Estimated Savings -->
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 1.25rem; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); color: white;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; opacity: 0.9;">
                            <div style="padding: 0.5rem; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex;">
                                <span class="material-icons-round" style="font-size: 1.25rem;">savings</span>
                            </div>
                            <span style="font-size: 0.875rem; font-weight: 500;">Meta de Ahorro</span>
                        </div>
                        <div style="font-size: 1.75rem; font-weight: 700;">$${totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">
                            USD Estimados
                        </div>
                    </div>

                    <!-- Realized Savings -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 1.25rem; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); color: white;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; opacity: 0.9;">
                            <div style="padding: 0.5rem; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex;">
                                <span class="material-icons-round" style="font-size: 1.25rem;">monetization_on</span>
                            </div>
                            <span style="font-size: 0.875rem; font-weight: 500;">Ahorro Real</span>
                        </div>
                        <div style="font-size: 1.75rem; font-weight: 700;">$${totalRealized.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">
                            USD Confirmados
                        </div>
                    </div>

                    <!-- Compliance -->
                    <div style="background: white; padding: 1.25rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                            <div style="padding: 0.5rem; background: #fff7ed; border-radius: 8px; display: flex;">
                                <span class="material-icons-round" style="color: #f97316; font-size: 1.25rem;">pie_chart</span>
                            </div>
                            <span style="font-size: 0.875rem; font-weight: 500;">Cumplimiento</span>
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-main);">${compliance.toFixed(1)}%</div>
                            ${compliance >= 100 ?
                `<span class="material-icons-round" style="font-size: 1.25rem; color: var(--status-released);">trending_up</span>` :
                `<span class="material-icons-round" style="font-size: 1.25rem; color: var(--text-secondary);">trending_flat</span>`
            }
                        </div>
                        <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; margin-top: 0.5rem; overflow: hidden;">
                            <div style="width: ${Math.min(compliance, 100)}%; height: 100%; background: ${compliance >= 100 ? 'var(--status-released)' : 'var(--primary-color)'}; border-radius: 3px;"></div>
                        </div>
                    </div>

                </div>

                <!-- Kanban Board -->
                <div class="kanban-board" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-bottom: 1rem; overflow-x: auto; flex: 1; min-height: 0;">
                    ${this.renderColumn('IDEA', 'Idea', 'lightbulb')}
                    ${this.renderColumn('PLAN', 'Planeación', 'architecture')}
                    ${this.renderColumn('EXECUTION', 'Ejecución', 'engineering')}
                    ${this.renderColumn('COMPLETED', 'Completado', 'verified')}
                </div>
            </div>

            ${this.renderModal()}
        `;
    }

    renderColumn(status, title, icon) {
        const items = this.projects.filter(p => p.status === status);
        const totalSavings = items.reduce((acc, curr) => acc + (Number(curr.estimatedSavings) || 0), 0);

        const colorMap = {
            'IDEA': 'var(--status-draft)',
            'PLAN': 'var(--status-transit)',
            'EXECUTION': 'var(--primary-color)',
            'COMPLETED': 'var(--status-released)'
        };
        const color = colorMap[status];

        return `
            <div class="kanban-column" data-status="${status}" 
                 style="background: var(--bg-card); border-radius: 12px; display: flex; flex-direction: column; min-width: 280px; border-top: 4px solid ${color};">
                
                <div class="column-header" style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main);">
                            <span class="material-icons-round" style="font-size: 1.25rem; color: ${color};">${icon}</span>
                            ${title}
                        </div>
                        <span style="background: var(--bg-body); padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; color: var(--text-secondary);">${items.length}</span>
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        $${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span style="font-size: 0.75rem;">USD</span>
                    </div>
                </div>

                <div class="column-body" style="padding: 0.75rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.75rem;"
                     ondrop="window.handleDrop(event, '${status}')" 
                     ondragover="window.handleDragOver(event)">
                    ${items.map(p => this.renderCard(p)).join('')}
                    ${items.length === 0 ? `<div style="text-align: center; padding: 2rem; color: var(--text-light); font-size: 0.875rem; border: 2px dashed var(--border-color); border-radius: 8px;">Arrastra proyectos aquí</div>` : ''}
                </div>
            </div>
        `;
    }

    renderCard(project) {
        // Calculate financial progress
        const estimated = Number(project.estimatedSavings) || 0;
        const realizedEntries = this.store.getAll('savingsEntries').filter(e => e.projectId === project.id);
        const realized = realizedEntries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

        let financialProgress = 0;
        if (estimated > 0) {
            financialProgress = Math.min((realized / estimated) * 100, 100);
        }

        return `
            <div class="kanban-card" draggable="true" ondragstart="window.handleDragStart(event, '${project.id}')"
                 onclick="window.openProjectModal('${project.id}')"
                 style="background: var(--bg-body); padding: 1rem; border-radius: 8px; cursor: Grab; border: 1px solid transparent; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                
                <div style="position: relative; z-index: 2;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-main); font-weight: 600;">${project.name}</h4>
                        ${project.category ? `<span style="font-size: 0.65rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); white-space: nowrap;">${project.category}</span>` : ''}
                    </div>
                    
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.4em;">
                        ${project.description || 'Sin descripción'}
                    </div>

                    <div style="margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px;">
                            <span>Meta: $${estimated.toLocaleString('en-US', { notation: "compact", maximumFractionDigits: 1 })}</span>
                            <span>$${realized.toLocaleString('en-US', { notation: "compact", maximumFractionDigits: 1 })} (${financialProgress.toFixed(0)}%)</span>
                        </div>
                        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: ${financialProgress >= 100 ? 'var(--status-released)' : 'var(--primary-color)'}; width: ${financialProgress}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
                         <div style="display: flex; align-items: center; gap: 4px;" title="Avance del Proyecto">
                            <span class="material-icons-round" style="font-size: 1rem;">timelapse</span>
                            ${project.progress || 0}%
                        </div>
                        
                        ${project.owner ? `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 20px; height: 20px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 50%; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 600;">
                                ${project.owner.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderModal() {
        return `
            <div id="project-modal" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: var(--bg-surface, #ffffff); width: 100%; max-width: 650px; border-radius: 12px; display: flex; flex-direction: column; max-height: 90vh; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <h3 id="modal-title" style="margin: 0; font-size: 1.25rem; color: var(--text-main);">Nuevo Proyecto</h3>
                        <button id="btn-cancel-modal-x" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
                            <span class="material-icons-round">close</span>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div style="display: flex; gap: 1rem; padding: 0 1.5rem; border-bottom: 1px solid var(--border-color); background: #f8fafc;">
                        <button class="tab-btn active" data-tab="tab-general" style="padding: 1rem 0; border: none; background: none; font-weight: 600; color: var(--primary-color); border-bottom: 2px solid var(--primary-color); cursor: pointer;">General</button>
                        <button class="tab-btn" data-tab="tab-financial" style="padding: 1rem 0; border: none; background: none; color: var(--text-secondary); cursor: pointer;">Finanzas</button>
                        <button class="tab-btn" data-tab="tab-documents" style="padding: 1rem 0; border: none; background: none; color: var(--text-secondary); cursor: pointer;">Documentos</button>
                        <button class="tab-btn" data-tab="tab-logs" style="padding: 1rem 0; border: none; background: none; color: var(--text-secondary); cursor: pointer;">Historial</button>
                    </div>

                    <!-- Body -->
                    <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                        <form id="project-form">
                            <input type="hidden" id="p-id" name="id">
                            
                            <!-- Tab: General -->
                            <div id="tab-general" class="tab-content">
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Nombre del Proyecto</label>
                                    <input type="text" id="p-name" name="name" required class="form-control" style="width: 100%;">
                                </div>

                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Categoría</label>
                                    <select id="p-category" name="category" class="form-control" style="width: 100%;">
                                        <option value="General">General</option>
                                        <option value="Logistics">Logística y Transporte</option>
                                        <option value="Negotiation">Negociación con Proveedores</option>
                                        <option value="Material Change">Cambio de Material/Diseño</option>
                                        <option value="Process">Optimización de Procesos</option>
                                        <option value="Inventory">Reducción de Inventario</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Descripción</label>
                                    <textarea id="p-description" name="description" rows="3" class="form-control" style="width: 100%;"></textarea>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div class="form-group">
                                        <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Responsable</label>
                                        <input type="text" id="p-owner" name="owner" class="form-control" style="width: 100%;">
                                    </div>
                                    <div class="form-group">
                                        <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Progreso (%)</label>
                                        <input type="number" id="p-progress" name="progress" min="0" max="100" class="form-control" style="width: 100%;">
                                    </div>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Fecha Inicio</label>
                                        <input type="date" id="p-start" name="startDate" class="form-control" style="width: 100%;">
                                    </div>
                                    <div class="form-group">
                                        <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Fecha Fin</label>
                                        <input type="date" id="p-end" name="endDate" class="form-control" style="width: 100%;">
                                    </div>
                                </div>
                            </div>

                            <!-- Tab: Financial -->
                            <div id="tab-financial" class="tab-content" style="display: none;">
                                <div class="form-group" style="margin-bottom: 1.5rem;">
                                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 600;">Meta de Ahorro (Estimado)</label>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <span style="font-size: 1.25rem; font-weight: 600;">$</span>
                                        <input type="number" id="p-savings" name="estimatedSavings" step="0.01" class="form-control" style="width: 100%; font-size: 1.1rem;">
                                        <span>USD</span>
                                    </div>
                                </div>

                                <!-- Realized Savings Logic (Same as before but inside tab) -->
                                <div id="realized-savings-section" style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                        <h4 style="margin: 0; font-size: 0.95rem;">Ahorros Reales Reportados</h4>
                                        <div style="font-weight: 700; color: var(--status-released);">
                                            Total: $<span id="total-realized">0</span> USD
                                        </div>
                                    </div>

                                    <div style="background: var(--bg-body); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                                            <div>
                                                <label style="font-size: 0.75rem; color: var(--text-secondary);">Fecha</label>
                                                <input type="date" id="new-entry-date" class="form-control" style="width: 100%;">
                                            </div>
                                            <div>
                                                <label style="font-size: 0.75rem; color: var(--text-secondary);">Monto (USD)</label>
                                                <input type="number" id="new-entry-amount" step="0.01" class="form-control" style="width: 100%;">
                                            </div>
                                            <button type="button" id="btn-add-entry" class="btn btn-primary" style="padding: 0.5rem;">
                                                <span class="material-icons-round">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
                                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                            <tbody id="entries-list"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Tab: Documents -->
                            <div id="tab-documents" class="tab-content" style="display: none;">
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                                    <input type="text" id="new-doc-name" placeholder="Nombre del archivo/enlace" class="form-control" style="flex: 1;">
                                    <input type="text" id="new-doc-url" placeholder="URL del documento" class="form-control" style="flex: 2;">
                                    <button type="button" id="btn-add-doc" class="btn btn-primary">Subir</button>
                                </div>
                                <div id="documents-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <!-- Dynamic Docs -->
                                </div>
                            </div>

                            <!-- Tab: Logs -->
                            <div id="tab-logs" class="tab-content" style="display: none;">
                                <div id="logs-list" style="border-left: 2px solid var(--border-color); padding-left: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                                    <!-- Dynamic Logs -->
                                </div>
                            </div>

                        </form>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                        <button type="button" id="btn-delete-project" class="btn" style="color: #ef4444; border: none; background: none; padding: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-icons-round">delete</span> Eliminar
                        </button>
                        <div style="display: flex; gap: 0.75rem;">
                            <button type="button" id="btn-cancel-modal" class="btn" style="background: white; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="button" onclick="document.querySelector('#project-form').dispatchEvent(new Event('submit'))" class="btn btn-primary">Guardar Proyecto</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    attachEvents() {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');

        // Open Modal (New)
        document.getElementById('btn-new-project').addEventListener('click', () => {
            this.prepareModal();
            modal.style.display = 'flex';
        });

        // Close Modal
        const closeFunc = () => modal.style.display = 'none';
        document.getElementById('btn-cancel-modal').addEventListener('click', closeFunc);
        document.getElementById('btn-cancel-modal-x').addEventListener('click', closeFunc);

        // Tab Switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = 'none';
                    b.style.color = 'var(--text-secondary)';
                });
                // Hide all contents
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

                // Activate clicked
                const targetId = e.target.closest('button').dataset.tab;
                e.target.closest('button').classList.add('active');
                e.target.closest('button').style.borderBottom = '2px solid var(--primary-color)';
                e.target.closest('button').style.color = 'var(--primary-color)';

                document.getElementById(targetId).style.display = 'block';
            });
        });

        // Save
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                id: formData.get('id') || crypto.randomUUID(),
                name: formData.get('name'),
                description: formData.get('description'),
                category: formData.get('category'),
                status: this.currentStatus || 'IDEA',
                estimatedSavings: formData.get('estimatedSavings'),
                progress: formData.get('progress'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                owner: formData.get('owner'),
                createdAt: new Date().toISOString(),
                currency: 'USD'
            };

            if (formData.get('id')) {
                // Update
                const existing = this.store.getById('savingsProjects', data.id);
                data.status = existing.status;
                data.createdAt = existing.createdAt;
                await this.store.update('savingsProjects', data.id, data);
            } else {
                // Create
                await this.store.add('savingsProjects', data);
            }

            modal.style.display = 'none';
            this.refresh();
        });

        // Delete
        document.getElementById('btn-delete-project').addEventListener('click', async () => {
            const id = document.getElementById('p-id').value;
            // Logic inside event to avoid closure stale scope issues
            if (id && confirm('¿Eliminar este proyecto?')) {
                await this.store.delete('savingsProjects', id);
                modal.style.display = 'none';
                this.refresh();
            }
        });

        // Add Entry
        document.getElementById('btn-add-entry').addEventListener('click', async () => {
            const date = document.getElementById('new-entry-date').value;
            const amount = document.getElementById('new-entry-amount').value;
            const projectId = document.getElementById('p-id').value;

            if (date && amount && projectId) {
                const entry = {
                    id: crypto.randomUUID(),
                    projectId: projectId,
                    date: date,
                    amount: parseFloat(amount),
                    currency: 'USD',
                    description: 'Ahorro registrado',
                    createdAt: new Date().toISOString()
                };

                await this.store.add('savingsEntries', entry);

                // Log Action
                await this.store.add('savingsLogs', {
                    id: crypto.randomUUID(),
                    projectId: projectId,
                    action: 'SAVING_ADDED',
                    details: `Ahorro de $${amount} registrado`,
                    user: 'Usuario Actual',
                    createdAt: new Date().toISOString()
                });

                document.getElementById('new-entry-date').value = '';
                document.getElementById('new-entry-amount').value = '';
                this.renderEntriesList(projectId);
                // Also update logs list if tab is open, but simple re-render triggers refresh? No, logs list needs refresh
                this.renderLogsList(projectId);
            }
        });

        // Add Document
        document.getElementById('btn-add-doc').addEventListener('click', async () => {
            const name = document.getElementById('new-doc-name').value;
            const url = document.getElementById('new-doc-url').value;
            const projectId = document.getElementById('p-id').value;

            if (name && url && projectId) {
                await this.store.add('savingsDocuments', {
                    id: crypto.randomUUID(),
                    projectId: projectId,
                    filename: name,
                    fileUrl: url,
                    uploadedBy: 'Usuario Actual',
                    createdAt: new Date().toISOString()
                });
                document.getElementById('new-doc-name').value = '';
                document.getElementById('new-doc-url').value = '';
                this.renderDocumentsList(projectId);
            }
        });

        // Global DnD Handlers
        window.handleDragStart = (e, id) => {
            e.dataTransfer.setData('text/plain', id);
            e.target.style.opacity = '0.5';
        };

        window.handleDragOver = (e) => {
            e.preventDefault();
        };

        window.handleDrop = async (e, newStatus) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const card = document.querySelector(`.kanban-card[onclick*="${id}"]`);
            if (card) card.style.opacity = '1';

            if (id) {
                const project = this.store.getById('savingsProjects', id);
                if (project && project.status !== newStatus) {
                    await this.store.update('savingsProjects', id, { status: newStatus });
                    // Log Status Change
                    await this.store.add('savingsLogs', {
                        id: crypto.randomUUID(),
                        projectId: id,
                        action: 'STATUS_CHANGE',
                        details: `Cambio de estado a ${newStatus}`,
                        user: 'Usuario Actual',
                        createdAt: new Date().toISOString()
                    });
                    this.refresh();
                }
            }
        };

        window.openProjectModal = (id) => {
            const project = this.store.getById('savingsProjects', id);
            if (project) {
                this.prepareModal(project);
                modal.style.display = 'flex';
            }
        };
    }

    prepareModal(project = null) {
        document.getElementById('p-id').value = project ? project.id : '';
        document.getElementById('p-name').value = project ? project.name : '';
        document.getElementById('p-description').value = project ? project.description : '';
        document.getElementById('p-category').value = project ? (project.category || 'General') : 'General';
        document.getElementById('p-savings').value = project ? project.estimatedSavings : '';
        document.getElementById('p-progress').value = project ? project.progress : 0;
        document.getElementById('p-start').value = project ? project.startDate : '';
        document.getElementById('p-end').value = project ? project.endDate : '';
        document.getElementById('p-owner').value = project ? project.owner : 'Usuario Actual';

        document.getElementById('modal-title').textContent = project ? 'Editar Proyecto' : 'Nuevo Proyecto';
        document.getElementById('btn-delete-project').style.display = project ? 'flex' : 'none';

        this.currentStatus = project ? project.status : 'IDEA';

        // Reset Tabs
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderBottom = 'none';
            b.style.color = 'var(--text-secondary)';
        });
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        // Default Tab
        const defaultTab = document.querySelector('[data-tab="tab-general"]');
        defaultTab.classList.add('active');
        defaultTab.style.borderBottom = '2px solid var(--primary-color)';
        defaultTab.style.color = 'var(--primary-color)';
        document.getElementById('tab-general').style.display = 'block';

        if (project) {
            this.renderEntriesList(project.id);
            this.renderDocumentsList(project.id);
            this.renderLogsList(project.id);
        } else {
            // New project: Hide advanced tabs or just leave empty?
            // Hiding entries list is handled by tab switching now
        }
    }

    renderEntriesList(projectId) {
        const entries = this.store.getAll('savingsEntries').filter(e => e.projectId === projectId);
        const tbody = document.getElementById('entries-list');
        const totalSpan = document.getElementById('total-realized');

        if (!tbody) return;

        tbody.innerHTML = entries.map(e => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.5rem;">${new Date(e.date).toLocaleDateString()}</td>
                <td style="padding: 0.5rem; font-weight: 500;">$${Number(e.amount).toLocaleString()}</td>
                <td style="padding: 0.5rem; text-align: right;">
                    <span class="material-icons-round" style="font-size: 1rem; cursor: pointer; color: #ef4444;" 
                          onclick="window.deleteSavingsEntry('${e.id}', '${projectId}')">delete</span>
                </td>
            </tr>
        `).join('');

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 1rem; color: var(--text-secondary);">No hay registros aún</td></tr>';
        }

        const total = entries.reduce((acc, curr) => acc + Number(curr.amount), 0);
        totalSpan.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        // Global Delete Handler
        window.deleteSavingsEntry = async (entryId, pId) => {
            if (confirm('¿Borrar registro?')) {
                await this.store.delete('savingsEntries', entryId);
                this.renderEntriesList(pId);
            }
        };
    }

    renderDocumentsList(projectId) {
        const docs = this.store.getAll('savingsDocuments').filter(d => d.projectId === projectId);
        const container = document.getElementById('documents-list');
        if (!container) return;

        container.innerHTML = docs.map(d => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.75rem; overflow: hidden;">
                    <span class="material-icons-round" style="color: var(--primary-color);">description</span>
                    <a href="${d.fileUrl}" target="_blank" style="text-decoration: none; color: var(--text-main); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">
                        ${d.filename}
                    </a>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary);">
                    <span>${new Date(d.createdAt).toLocaleDateString()}</span>
                    <button type="button" onclick="window.deleteSavingsDoc('${d.id}', '${projectId}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                        <span class="material-icons-round" style="font-size: 1.1rem;">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        if (docs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No hay documentos</div>';
        }

        window.deleteSavingsDoc = async (docId, pId) => {
            if (confirm('¿Eliminar documento?')) {
                await this.store.delete('savingsDocuments', docId);
                this.renderDocumentsList(pId);
            }
        };
    }

    renderLogsList(projectId) {
        const logs = this.store.getAll('savingsLogs').filter(l => l.projectId === projectId);
        // Sort newest first
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const container = document.getElementById('logs-list');
        if (!container) return;

        container.innerHTML = logs.map(l => `
            <div style="position: relative; padding-bottom: 1.5rem;">
                <div style="position: absolute; left: -1.45rem; top: 0; width: 12px; height: 12px; background: var(--text-secondary); border-radius: 50%; border: 2px solid white;"></div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                    ${new Date(l.createdAt).toLocaleString()} - <span style="font-weight: 600;">${l.user || 'Sistema'}</span>
                </div>
                <div style="font-weight: 500; font-size: 0.9rem; color: var(--text-main);">
                    ${l.details}
                </div>
            </div>
        `).join('');

        if (logs.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary);">Sin actividad registrada</div>';
        }
    }

    refresh() {
        const container = document.getElementById('view-container');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();
        }
    }
}
