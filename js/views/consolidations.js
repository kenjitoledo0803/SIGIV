import { Consolidation, ConsolidationStatus, CostRecord } from '../models.js';

export class ConsolidationsView {
    constructor(store) {
        this.store = store;
    }

    render(params) {
        const id = params[0];
        if (id) {
            return this.renderDetail(id);
        }

        const consolidations = this.store.getAll('consolidations').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return `
            <div style="margin-bottom: 1.5rem;">
                <div style="position: relative;">
                    <span class="material-icons-round" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">search</span>
                    <input type="text" id="search-consolidations" placeholder="Buscar por Referencia o Descripción..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Consolidaciones</h2>
                    <button id="btn-new-consolidation" class="btn btn-primary">
                        <span class="material-icons-round">add</span> Nueva Consolidación
                    </button>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 1rem;">Referencia</th>
                            <th style="padding: 1rem;">Descripción</th>
                            <th style="padding: 1rem;">Estatus</th>
                            <th style="padding: 1rem;">Fecha Creación</th>
                            <th style="padding: 1rem;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${consolidations.map(c => `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 1rem; font-weight: 600;">${c.reference}</td>
                                <td style="padding: 1rem;">${c.description || '-'}</td>
                                <td style="padding: 1rem;">
                                    <span style="
                                        background-color: ${c.status === 'ABIERTO' ? '#dbeafe' : '#d1fae5'}; 
                                        color: ${c.status === 'ABIERTO' ? '#1e40af' : '#065f46'}; 
                                        padding: 0.25rem 0.75rem; 
                                        border-radius: 999px; 
                                        font-size: 0.875rem; 
                                        font-weight: 500;
                                    ">${c.status}</span>
                                </td>
                                <td style="padding: 1rem;">${new Date(c.createdAt).toLocaleDateString()}</td>
                                <td style="padding: 1rem;">
                                    <a href="#consolidations/${c.id}" class="btn-icon" style="text-decoration: none; color: var(--primary-color);">
                                        <span class="material-icons-round">visibility</span>
                                    </a>
                                </td>
                            </tr>
                        `).join('')}
                        ${consolidations.length === 0 ? '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No hay consolidaciones registradas.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
            <div id="modal-container"></div>
        `;
    }

    renderDetail(id) {
        const consolidation = this.store.getById('consolidations', id);
        if (!consolidation) return '<div class="card">Consolidación no encontrada</div>';

        const allShipments = this.store.getAll('shipments');
        const linkedShipments = allShipments.filter(s => s.consolidationId === id);

        // Aggregate Data
        const allPOs = this.store.getAll('importFiles').filter(po => linkedShipments.some(s => s.id === po.shipmentId));

        // Docs: From Shipments + From POs
        const shipmentDocs = linkedShipments.flatMap(s => (s.documents || []).map(d => ({ ...d, source: `Embarque ${s.reference}` })));
        const poDocs = allPOs.flatMap(po => (po.documents || []).map(d => ({ ...d, source: `PO ${po.referenceNumber}` })));
        const allDocs = [...shipmentDocs, ...poDocs];

        // Costs: From Shipments + From POs
        const shipmentCosts = linkedShipments.flatMap(s => (s.costs || []).map(c => ({ ...c, source: `Embarque ${s.reference}` })));
        const poCosts = allPOs.flatMap(po => (po.costs || []).map(c => ({ ...c, source: `PO ${po.referenceNumber}` })));
        const allCosts = [...shipmentCosts, ...poCosts];

        const totalLinkedCostMXN = allCosts.reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);
        const totalConsolidationCostMXN = (consolidation.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);
        const grandTotal = totalLinkedCostMXN + totalConsolidationCostMXN;

        // Ensure attachDetailEvents is called after render
        setTimeout(() => this.attachDetailEvents(id), 0);

        return `
            <div id="consolidation-detail-view">
            <div style="margin-bottom: 2rem;">
                <a href="#consolidations" style="text-decoration: none; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 1.25rem;">arrow_back</span> Volver a Consolidaciones
                </a>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">${consolidation.reference}</h1>
                        <p style="color: var(--text-secondary);">${consolidation.description || 'Sin descripción'}</p>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Arribo a Planta</label>
                            <input type="datetime-local" id="input-plant-arrival" value="${(consolidation.plantArrivalDate || '').replace(' ', 'T').slice(0, 16)}" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit;">
                        </div>
                        <button id="btn-save-arrival" class="btn btn-primary" style="height: fit-content;">Guardar Fecha</button>
                        <span style="background-color: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 500;">${consolidation.status}</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                
                <!-- Left Column -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    
                    <!-- Linked Shipments -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0;">Embarques Vinculados</h3>
                            <button id="btn-link-shipment" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                                <span class="material-icons-round" style="font-size: 1rem;">link</span> Vincular Embarque
                            </button>
                        </div>
                        ${linkedShipments.length > 0 ? `
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                                        <th style="padding: 0.5rem;">Referencia</th>
                                        <th style="padding: 0.5rem;">Status</th>
                                        <th style="padding: 0.5rem;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${linkedShipments.map(s => `
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td style="padding: 0.5rem;"><a href="#shipments/${s.id}">${s.reference}</a></td>
                                            <td style="padding: 0.5rem;">${s.status}</td>
                                            <td style="padding: 0.5rem;">
                                                <button class="btn-unlink-shipment" data-id="${s.id}" style="color: #ef4444; border: none; background: none; cursor: pointer;">
                                                    <span class="material-icons-round">link_off</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color: var(--text-secondary);">No hay embarques vinculados.</p>'}
                    </div>

                    <!-- Consolidated Docs -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Documentación Consolidada</h3>
                        ${allDocs.length > 0 ? `
                            <ul style="list-style: none; padding: 0;">
                                ${allDocs.map(doc => `
                                    <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span class="material-icons-round" style="color: var(--primary-color);">description</span>
                                            <div>
                                                <div style="font-weight: 500;">${doc.type} <span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-body); padding: 2px 6px; border-radius: 4px;">${doc.source}</span></div>
                                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <a href="#" style="color: var(--text-secondary);"><span class="material-icons-round">download</span></a>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p style="color: var(--text-secondary);">No hay documentos disponibles.</p>'}
                    </div>

                    <!-- Consolidated Costs (From Linked Items) -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Gastos de Items Vinculados</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Concepto</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Fuente</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Monto Orig.</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Total MXN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allCosts.map(cost => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 0.5rem;">${cost.type}</td>
                                        <td style="padding: 0.5rem;"><span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-body); padding: 2px 6px; border-radius: 4px;">${cost.source}</span></td>
                                        <td style="padding: 0.5rem;">${cost.amount.toLocaleString()} ${cost.currency}</td>
                                        <td style="padding: 0.5rem; font-weight: 500;">$${(cost.amount * cost.exchangeRate).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                `).join('')}
                                <tr style="background-color: var(--bg-body); font-weight: 600;">
                                    <td colspan="3" style="padding: 0.75rem;">TOTAL VINCULADO</td>
                                    <td style="padding: 0.75rem;">$${totalLinkedCostMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Consolidation Costs -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-icons-round" style="color: var(--primary-color);">attach_money</span>
                                Costos de la Consolidación
                            </h3>
                            <div style="display: flex; gap: 0.5rem;">
                                <button id="btn-add-cost" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                    <span class="material-icons-round" style="font-size: 1rem;">add</span> Agregar
                                </button>
                            </div>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">Concepto</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">Monto Orig.</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">T.C.</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">Total MXN</th>
                                    <th style="padding: 0.75rem;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(consolidation.costs || []).map(cost => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem 0.75rem;">
                                            <div style="font-weight: 500;">${cost.type}</div>
                                            ${cost.fileName ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.1rem;">${cost.fileName}</div>` : ''}
                                        </td>
                                        <td style="padding: 1rem 0.75rem;">${cost.amount.toLocaleString()} ${cost.currency}</td>
                                        <td style="padding: 1rem 0.75rem;">${cost.exchangeRate}</td>
                                        <td style="padding: 1rem 0.75rem; font-weight: 600;">$${(cost.amount * cost.exchangeRate).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td style="padding: 1rem 0.75rem; text-align: right;">
                                            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                                                ${cost.pdfUrl ? `
                                                <a href="${cost.pdfUrl}" target="_blank" class="btn-icon" title="Visualizar" style="text-decoration: none; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">visibility</span>
                                                </a>
                                                <a href="${cost.pdfUrl}" download="${cost.fileName || 'costo'}" class="btn-icon" title="Descargar" style="text-decoration: none; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">download</span>
                                                </a>
                                                ` : ''}
                                                <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Eliminar" style="border: none; background: transparent; color: #ef4444; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr style="background-color: var(--bg-body); font-weight: 700; color: var(--text-main);">
                                    <td style="padding: 1rem 0.75rem; border-radius: 0 0 0 var(--radius-md);">TOTAL CONSOLIDACIÓN</td>
                                    <td colspan="2"></td>
                                    <td style="padding: 1rem 0.75rem;">$${totalConsolidationCostMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td style="border-radius: 0 0 var(--radius-md) 0;"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Proration Table -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Prorrateo de Gastos de Consolidación (Base Peso)</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">PO</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Embarque</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Peso (kg)</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">% Part.</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Monto Asignado (MXN)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
                const totalWeight = allPOs.reduce((acc, po) => acc + (Number(po.grossWeight) || 0), 0);

                if (totalWeight === 0) return '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--text-secondary);">No hay pesos registrados en las POs para calcular el prorrateo.</td></tr>';

                return allPOs.map(po => {
                    const weight = Number(po.grossWeight) || 0;
                    const share = weight / totalWeight;
                    const allocatedAmount = totalConsolidationCostMXN * share;
                    const shipment = linkedShipments.find(s => s.id === po.shipmentId);

                    return `
                                            <tr style="border-bottom: 1px solid var(--border-color);">
                                                <td style="padding: 0.5rem;"><a href="#expedientes/${po.id}">${po.referenceNumber}</a></td>
                                                <td style="padding: 0.5rem;">${shipment ? shipment.reference : '-'}</td>
                                                <td style="padding: 0.5rem;">${weight.toLocaleString()} kg</td>
                                                <td style="padding: 0.5rem;">${(share * 100).toFixed(2)}%</td>
                                                <td style="padding: 0.5rem; font-weight: 600;">$${allocatedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        `;
                }).join('');
            })()}
                                <tr style="background-color: var(--bg-body); font-weight: 600;">
                                    <td colspan="4" style="padding: 0.75rem;">TOTAL ASIGNADO</td>
                                    <td style="padding: 0.75rem;">$${totalConsolidationCostMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                <!-- Right Column -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                     <div class="card">
                        <h3 style="margin-bottom: 1rem;">Resumen Financiero</h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-secondary);">Total Embarques:</span>
                            <strong>${linkedShipments.length}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-secondary);">Total POs:</span>
                            <strong>${allPOs.length}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <span style="font-weight: 600;">Total Gasto:</span>
                            <span style="font-weight: 700; color: var(--primary-color);">$${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                </div>

            </div>
            <div id="modal-container"></div>
            </div>
        `;
    }

    attachDetailEvents(id) {
        const btnLink = document.getElementById('btn-link-shipment');
        if (btnLink) {
            btnLink.addEventListener('click', () => this.openLinkShipmentModal(id));
        }

        const btnSaveArrival = document.getElementById('btn-save-arrival');
        if (btnSaveArrival) {
            btnSaveArrival.addEventListener('click', () => {
                const dateVal = document.getElementById('input-plant-arrival').value;
                if (!dateVal) return alert('Selecciona una fecha y hora');

                // Convert T to space for DB compatibility (YYYY-MM-DD HH:mm:ss)
                const date = dateVal.replace('T', ' ');

                // 1. Update Consolidation
                this.store.update('consolidations', id, { plantArrivalDate: date });

                // 2. Propagate to Shipments
                const linkedShipments = this.store.getAll('shipments').filter(s => s.consolidationId === id);
                linkedShipments.forEach(s => {
                    this.store.update('shipments', s.id, { plantArrivalDate: date });
                });

                // 3. Propagate to POs
                const allPOs = this.store.getAll('importFiles');
                const linkedPOs = allPOs.filter(po => linkedShipments.some(s => s.id === po.shipmentId));
                linkedPOs.forEach(po => {
                    this.store.update('importFiles', po.id, { plantArrivalDate: date });
                });

                alert('Fecha de Arribo a Planta actualizada y propagada a todos los embarques y POs vinculados.');
                window.location.reload();
            });
        }

        document.querySelectorAll('.btn-unlink-shipment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shipmentId = e.currentTarget.dataset.id;
                if (confirm('¿Desvincular este embarque de la consolidación?')) {
                    this.store.update('shipments', shipmentId, { consolidationId: null });
                    window.location.reload();
                }
            });
        });

        // Add Cost (Event Delegation)
        const viewContainer = document.getElementById('consolidation-detail-view');
        if (viewContainer) {
            viewContainer.addEventListener('click', (e) => {
                const btnAddCost = e.target.closest('#btn-add-cost');
                if (btnAddCost) {
                    this.openAddCostModal(id);
                }
            });
        }

        // Delete Cost
        document.querySelectorAll('.btn-delete-cost').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('¿Eliminar este costo de la consolidación?')) {
                    const costId = btn.dataset.id;
                    const consolidation = this.store.getById('consolidations', id);
                    if (consolidation && consolidation.costs) {
                        const costs = consolidation.costs.filter(c => c.id !== costId);
                        this.store.update('consolidations', id, { costs });
                        window.location.reload();
                    }
                }
            });
        });
    }

    attachEvents() {
        const btnNew = document.getElementById('btn-new-consolidation');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openCreateModal());
        }

        // Search Filter
        const searchInput = document.getElementById('search-consolidations');
        if (searchInput) {
            let debounceTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                const term = e.target.value.toLowerCase();

                debounceTimeout = setTimeout(() => {
                    const rows = document.querySelectorAll('tbody tr');

                    if (term.length === 0) {
                        rows.forEach(row => row.style.display = '');
                        return;
                    }

                    rows.forEach(row => {
                        const text = row.innerText.toLowerCase();
                        if (text.includes(term)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                }, 300);
            });
        }
    }

    openCreateModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 2rem; border-radius: var(--radius-lg); width: 100%; max-width: 500px; box-shadow: var(--shadow-xl);">
                    <h2 style="margin-top: 0; margin-bottom: 1.5rem;">Nueva Consolidación</h2>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Referencia</label>
                        <input type="text" id="input-ref" placeholder="Ej. CONS-2023-001" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción</label>
                        <textarea id="input-desc" placeholder="Descripción opcional..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);"></textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                        <button id="btn-cancel" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                        <button id="btn-save" class="btn btn-primary">Crear</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            const reference = document.getElementById('input-ref').value;
            const description = document.getElementById('input-desc').value;

            if (!reference) return alert('La referencia es obligatoria');

            const newConsolidation = new Consolidation({ reference, description });
            this.store.add('consolidations', newConsolidation);

            modalContainer.innerHTML = '';
            window.location.reload();
        });
    }

    openLinkShipmentModal(consolidationId) {
        const allShipments = this.store.getAll('shipments');
        const availableShipments = allShipments.filter(s => !s.consolidationId);

        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 2rem; border-radius: var(--radius-lg); width: 100%; max-width: 600px; box-shadow: var(--shadow-xl);">
                    <h2 style="margin-top: 0; margin-bottom: 1.5rem;">Vincular Embarque</h2>
                    
                    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        ${availableShipments.length > 0 ? `
                            <table style="width: 100%; border-collapse: collapse;">
                                <tbody>
                                    ${availableShipments.map(s => `
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td style="padding: 0.75rem;">
                                                <div style="font-weight: 600;">${s.reference}</div>
                                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(s.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td style="padding: 0.75rem; text-align: right;">
                                                <button class="btn-select-shipment" data-id="${s.id}" style="padding: 0.25rem 0.75rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                                                    Seleccionar
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="padding: 1rem; text-align: center; color: var(--text-secondary);">No hay embarques disponibles para vincular.</p>'}
                    </div>

                    <div style="display: flex; justify-content: flex-end;">
                        <button id="btn-cancel-link" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel-link').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.querySelectorAll('.btn-select-shipment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shipmentId = e.currentTarget.dataset.id;
                this.store.update('shipments', shipmentId, { consolidationId });
                modalContainer.innerHTML = '';
                window.location.reload();
            });
        });
    }

    openAddCostModal(consolidationId) {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        const concepts = [
            'Flete Internacional', 'Flete Nacional', 'Transfer', 'Serv Logistico', 'Maniobras',
            'Almacenajes', 'Demoras', 'Honorários', 'DTA', 'Prevalidacion',
            'Limpieza de Contenedor', 'Desconsolidación', 'Aduana', 'Custom',
            'Gastos no Comprobables', 'Otros Incrementables', 'Inspeccion',
            'Reconocim', 'Seguro', 'Servicio'
        ];

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div class="card" style="width: 500px; max-width: 90%; background: #ffffff; box-shadow: var(--shadow-lg);">
                    <h3 style="margin-bottom: 1.5rem;">Agregar Costo a Consolidación</h3>
                    <form id="form-add-cost">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Concepto</label>
                            <select name="type" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <option value="">Seleccionar Concepto...</option>
                                ${concepts.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Monto Original</label>
                                <input type="number" name="amount" required step="0.01" min="0" placeholder="0.00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Moneda</label>
                                <select name="currency" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tipo de Cambio</label>
                            <input type="number" name="exchangeRate" required step="0.0001" min="0" value="1.0000" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Comprobante (PDF)</label>
                            <input type="file" name="file" accept=".pdf" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel-cost" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Costo</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel-cost').addEventListener('click', () => modalContainer.innerHTML = '');

        document.getElementById('form-add-cost').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const fileInput = e.target.querySelector('input[name="file"]');

            let pdfUrl = null;
            let fileName = null;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileName = file.name;
                // Read file as Data URL
                pdfUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            const consolidation = this.store.getById('consolidations', consolidationId);
            const newCost = new CostRecord({
                type: formData.get('type'),
                amount: formData.get('amount'),
                currency: formData.get('currency'),
                exchangeRate: formData.get('exchangeRate'),
                pdfUrl: pdfUrl,
                fileName: fileName
            });

            const costs = consolidation.costs || [];
            costs.push(newCost);
            this.store.update('consolidations', consolidationId, { costs });

            modalContainer.innerHTML = '';
            window.location.reload();
        });
    }
}
