import { Shipment, ImportFile, ShipmentStatus, CostRecord } from '../models.js';

export class ShipmentsView {
    constructor(store) {
        this.store = store;
    }

    render() {
        const shipments = this.store.getAll('shipments') || [];

        return `
            <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="margin-bottom: 0.5rem;">Gestión de Embarques</h2>
                    <p style="color: var(--text-secondary);">Agrupación de POs y consolidación de gastos.</p>
                </div>
                <button id="btn-new-shipment" class="btn btn-primary">
                    <span class="material-icons-round">add</span>
                    Nuevo Embarque
                </button>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="position: relative;">
                    <span class="material-icons-round" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">search</span>
                    <input type="text" id="search-shipments" placeholder="Buscar por Referencia o Estado..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <div class="card">
                ${shipments.length === 0 ? this.getEmptyState() : this.getTable(shipments)}
            </div>

            <div id="modal-container"></div>
        `;
    }

    getEmptyState() {
        return `
            <div style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;">local_shipping</span>
                <h3 style="margin-bottom: 0.5rem;">Sin embarques registrados</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Crea un embarque para agrupar tus POs.</p>
            </div>
        `;
    }

    getTable(shipments) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Referencia</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Estado</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Fecha Creación</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${shipments.map(s => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 1rem; font-weight: 600;">
                                <a href="#shipments/${s.id}" style="text-decoration: none; color: var(--primary-color);">${s.reference}</a>
                            </td>
                            <td style="padding: 1rem;">${s.status}</td>
                            <td style="padding: 1rem;">${new Date(s.createdAt).toLocaleDateString()}</td>
                            <td style="padding: 1rem;">
                                <a href="#shipments/${s.id}" class="btn-icon" style="text-decoration: none; color: var(--text-secondary); margin-right: 0.5rem;">
                                    <span class="material-icons-round">visibility</span>
                                </a>
                                <button class="btn-icon btn-delete-shipment" data-id="${s.id}" style="color: #ef4444; border: none; background: none; cursor: pointer;">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    attachEvents() {
        const btnNew = document.getElementById('btn-new-shipment');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openCreateModal());
        }

        // Search Filter
        const searchInput = document.getElementById('search-shipments');
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

        // Delete Shipment
        document.querySelectorAll('.btn-delete-shipment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de eliminar este embarque? Las POs vinculadas serán desvinculadas pero no eliminadas.')) {
                    const id = btn.dataset.id;

                    // Unlink all POs first
                    const allFiles = this.store.getAll('importFiles');
                    const linkedPOs = allFiles.filter(f => f.shipmentId === id);
                    linkedPOs.forEach(po => {
                        this.store.update('importFiles', po.id, { shipmentId: null });
                    });

                    // Delete shipment
                    this.store.delete('shipments', id);

                    // Refresh view
                    const container = document.getElementById('view-container');
                    container.innerHTML = this.render();
                    this.attachEvents();
                }
            });
        });
    }

    attachDetailEvents(id) {
        // Unlink PO
        document.querySelectorAll('.btn-unlink-po').forEach(btn => {
            btn.addEventListener('click', () => {
                const poId = btn.dataset.id;
                this.store.update('importFiles', poId, { shipmentId: null });

                // Refresh
                const container = document.getElementById('view-container');
                container.innerHTML = this.renderDetail(id);
                this.attachDetailEvents(id);
            });
        });

        // Link PO
        const btnLink = document.getElementById('btn-link-po');
        if (btnLink) {
            btnLink.addEventListener('click', () => {
                this.openLinkPOModal(id);
            });
        }

        // Update Status
        document.querySelectorAll('.btn-shipment-status').forEach(btn => {
            btn.addEventListener('click', () => {
                const newStatus = btn.dataset.status;
                this.store.update('shipments', id, { status: newStatus });
                // Refresh
                const container = document.getElementById('view-container');
                container.innerHTML = this.renderDetail(id);
                this.attachDetailEvents(id);
            });
        });

        // Add Cost (Event Delegation)
        const viewContainer = document.getElementById('shipment-detail-view');
        if (viewContainer) {
            viewContainer.addEventListener('click', (e) => {
                const btnAddCost = e.target.closest('#btn-add-cost');
                if (btnAddCost) {
                    console.log('Button Add Cost clicked (delegated)');
                    this.openAddCostModal(id);
                }
            });
        } else {
            console.error('Shipment detail view container not found for delegation');
        }

        // Save Pedimento Logic
        const btnSavePedimento = document.getElementById('btn-save-pedimento');
        if (btnSavePedimento) {
            btnSavePedimento.addEventListener('click', async () => {
                const pedimentoNumber = document.getElementById('input-pedimento-number').value;
                const fileInput = document.getElementById('input-pedimento-file');

                if (!pedimentoNumber) return alert('Ingresa el número de pedimento');
                if (fileInput.files.length === 0) return alert('Selecciona el archivo PDF del pedimento');

                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const pdfUrl = e.target.result;

                    // 1. Update Shipment (Add Document)
                    const shipment = this.store.getById('shipments', id);
                    const newDoc = {
                        id: crypto.randomUUID(),
                        type: 'Pedimento',
                        name: file.name,
                        url: pdfUrl,
                        uploadedAt: new Date().toISOString()
                    };
                    const documents = [...(shipment.documents || []), newDoc];
                    this.store.update('shipments', id, { documents, pedimentoNumber });

                    // 2. Propagate to Linked POs
                    const allFiles = this.store.getAll('importFiles');
                    const linkedPOs = allFiles.filter(f => f.shipmentId === id);
                    linkedPOs.forEach(po => {
                        this.store.update('importFiles', po.id, { pedimento: pedimentoNumber });
                    });

                    alert(`Pedimento guardado y propagado a ${linkedPOs.length} POs vinculadas.`);

                    // Refresh
                    const container = document.getElementById('view-container');
                    container.innerHTML = this.renderDetail(id);
                    this.attachDetailEvents(id);
                };

                reader.readAsDataURL(file);
            });
        }

        // AI Analysis Logic
        const btnAnalyze = document.getElementById('btn-analyze-pedimento');
        if (btnAnalyze) {
            btnAnalyze.addEventListener('click', async () => {
                const apiKey = 'AIzaSyC5EQgEWRUj3n4BOgGEjU15OTloSbr67s8';
                const fileInput = document.getElementById('input-pedimento-file');
                if (fileInput.files.length === 0) return alert('Selecciona un archivo PDF para analizar.');

                const btn = btnAnalyze;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="material-icons-round spin">refresh</span> Analizando...';

                const resultsContainer = document.getElementById('analysis-results');
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Analizando documento con IA, esto puede tomar unos segundos...</div>';

                try {
                    const file = fileInput.files[0];
                    const reader = new FileReader();

                    reader.onload = async (e) => {
                        const pdfUrl = e.target.result;
                        const { PedimentoAnalyzer } = await import('../services/pedimentoAnalyzer.js');
                        const analyzer = new PedimentoAnalyzer(apiKey);

                        try {
                            const result = await analyzer.analyze(pdfUrl);
                            this.renderAnalysisResults(result);
                        } catch (error) {
                            resultsContainer.innerHTML = `<div style="padding: 1rem; background: #fee2e2; color: #b91c1c; border-radius: var(--radius-md);">Error: ${error.message}</div>`;
                        } finally {
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                        }
                    };
                    reader.readAsDataURL(file);

                } catch (error) {
                    console.error(error);
                    alert('Error al procesar el archivo.');
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        }

        // Delete Cost
        document.querySelectorAll('.btn-delete-cost').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('¿Eliminar este costo del embarque?')) {
                    const costId = btn.dataset.id;
                    const shipment = this.store.getById('shipments', id);
                    if (shipment && shipment.costs) {
                        const costs = shipment.costs.filter(c => c.id !== costId);
                        this.store.update('shipments', id, { costs });

                        // Refresh
                        const container = document.getElementById('view-container');
                        container.innerHTML = this.renderDetail(id);
                        this.attachDetailEvents(id);
                    }
                }
            });
        });
    }

    openCreateModal() {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div class="card" style="width: 500px; max-width: 90%; background: #ffffff; box-shadow: var(--shadow-lg);">
                    <h3 style="margin-bottom: 1.5rem;">Nuevo Embarque</h3>
                    <form id="form-create-shipment">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Referencia</label>
                            <input type="text" name="reference" required placeholder="Ej: SHIP-2023-001" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción (Opcional)</label>
                            <textarea name="description" rows="3" placeholder="Notas adicionales..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);"></textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel-create" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Crear Embarque</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel-create').addEventListener('click', () => modalContainer.innerHTML = '');

        document.getElementById('form-create-shipment').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const newShipment = new Shipment({
                reference: formData.get('reference'),
                description: formData.get('description')
            });

            this.store.add('shipments', newShipment);

            modalContainer.innerHTML = '';

            // Refresh view
            const container = document.getElementById('view-container');
            container.innerHTML = this.render();
            this.attachEvents();
        });
    }

    openAddCostModal(shipmentId) {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.warn('Modal container not found, creating one...');
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
                    <h3 style="margin-bottom: 1.5rem;">Agregar Costo al Embarque</h3>
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

            const shipment = this.store.getById('shipments', shipmentId);
            const newCost = new CostRecord({
                type: formData.get('type'),
                amount: formData.get('amount'),
                currency: formData.get('currency'),
                exchangeRate: formData.get('exchangeRate'),
                pdfUrl: pdfUrl,
                fileName: fileName
            });

            const costs = shipment.costs || [];
            costs.push(newCost);
            this.store.update('shipments', shipmentId, { costs });

            modalContainer.innerHTML = '';
            // Refresh view
            const container = document.getElementById('view-container');
            container.innerHTML = this.renderDetail(shipmentId);
            this.attachDetailEvents(shipmentId);
        });
    }

    openLinkPOModal(shipmentId) {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        const allFiles = this.store.getAll('importFiles');
        const availablePOs = allFiles.filter(f => !f.shipmentId);

        if (availablePOs.length === 0) {
            alert('No hay POs disponibles para vincular.');
            return;
        }

        const renderPOList = (pos) => {
            if (pos.length === 0) return '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No se encontraron POs.</div>';
            return `
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    ${pos.map(po => `
                        <div class="po-item" data-id="${po.id}" style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
                            <div>
                                <div style="font-weight: 500;">${po.referenceNumber}</div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                    ${(po.items || []).length} items • ${new Date(po.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <span class="material-icons-round" style="color: var(--primary-color); opacity: 0;">add_circle</span>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div class="card" style="width: 500px; max-width: 90%; background: #ffffff; box-shadow: var(--shadow-lg);">
                    <h3 style="margin-bottom: 1rem;">Vincular PO</h3>
                    <div style="margin-bottom: 1rem;">
                        <input type="text" id="search-po-input" placeholder="Buscar PO..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    </div>
                    <div id="po-list-container" style="margin-bottom: 1.5rem;">
                        ${renderPOList(availablePOs)}
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <button type="button" id="btn-cancel-link" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners
        const input = document.getElementById('search-po-input');
        const listContainer = document.getElementById('po-list-container');
        const btnCancel = document.getElementById('btn-cancel-link');

        btnCancel.addEventListener('click', () => modalContainer.innerHTML = '');

        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = availablePOs.filter(po => po.referenceNumber.toLowerCase().includes(term));
            listContainer.innerHTML = renderPOList(filtered);
            attachItemEvents();
        });

        const attachItemEvents = () => {
            document.querySelectorAll('.po-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = 'var(--bg-body)';
                    item.querySelector('.material-icons-round').style.opacity = '1';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                    item.querySelector('.material-icons-round').style.opacity = '0';
                });
                item.addEventListener('click', () => {
                    const poId = item.dataset.id;
                    this.store.update('importFiles', poId, { shipmentId: shipmentId });
                    modalContainer.innerHTML = '';
                    // Refresh view
                    const container = document.getElementById('view-container');
                    container.innerHTML = this.renderDetail(shipmentId);
                    this.attachDetailEvents(shipmentId);
                });
            });
        };

        attachItemEvents();
        input.focus();
    }

    renderDetail(id) {
        const shipment = this.store.getById('shipments', id);
        if (!shipment) return '<div class="card">Embarque no encontrado</div>';

        // Get all POs associated with this shipment
        const allFiles = this.store.getAll('importFiles');
        const linkedPOs = allFiles.filter(f => f.shipmentId === id);
        const availablePOs = allFiles.filter(f => !f.shipmentId);

        // Consolidated Data
        const allDocs = linkedPOs.flatMap(po => (po.documents || []).map(d => ({ ...d, poRef: po.referenceNumber })));
        const allCosts = linkedPOs.flatMap(po => (po.costs || []).map(c => ({ ...c, poRef: po.referenceNumber })));

        // Add Shipment Level Costs/Docs if any (future feature, currently empty arrays in model)
        // ...

        const totalPOCosts = allCosts.reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);
        const totalShipmentCostMXN = (shipment.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);
        const grandTotal = totalPOCosts + totalShipmentCostMXN;

        return `
            <div id="shipment-detail-view">
            <div style="margin-bottom: 2rem;">
                <a href="#shipments" style="text-decoration: none; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 1.25rem;">arrow_back</span> Volver a Embarques
                </a>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">${shipment.reference}</h1>
                        <p style="color: var(--text-secondary);">Creado el: ${new Date(shipment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span style="background-color: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 500;">${shipment.status}</span>
                    </div>
                </div>
            </div>

            ${(() => {
                // Regulation Check Logic
                const materials = this.store.getAll('materials');
                const regulationWarnings = [];

                linkedPOs.forEach(po => {
                    (po.items || []).forEach(item => {
                        // Find material by SKU/Description match or if item has materialId (assuming item structure)
                        // In ImportItem, we usually have sku or description. Let's try to match with Material store.
                        // Ideally ImportItem should have materialId. If not, we match by SKU.
                        const material = materials.find(m => m.sku === item.sku);
                        if (material && material.regulations) {
                            regulationWarnings.push({
                                po: po.referenceNumber,
                                sku: material.sku,
                                regulation: material.regulations
                            });
                        }
                    });
                });

                if (regulationWarnings.length > 0) {
                    // Deduplicate warnings
                    const uniqueWarnings = [...new Map(regulationWarnings.map(w => [`${w.sku}-${w.regulation}`, w])).values()];

                    return `
                        <div class="card" style="background-color: #fff7ed; border-left: 4px solid #f97316; margin-bottom: 2rem;">
                            <div style="display: flex; align-items: start; gap: 1rem;">
                                <span class="material-icons-round" style="color: #f97316; font-size: 2rem;">warning</span>
                                <div>
                                    <h3 style="color: #9a3412; margin-bottom: 0.5rem;">Atención: Regulaciones Requeridas</h3>
                                    <p style="color: #c2410c; margin-bottom: 1rem;">Los siguientes materiales en este embarque requieren permisos especiales:</p>
                                    <ul style="list-style: none; padding: 0; display: grid; gap: 0.5rem;">
                                        ${uniqueWarnings.map(w => `
                                            <li style="display: flex; align-items: center; gap: 0.5rem; color: #9a3412;">
                                                <span class="material-icons-round" style="font-size: 1rem;">check_circle</span>
                                                <strong>${w.sku}</strong>: ${w.regulation}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return '';
            })()}

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                
                <!-- Left Column: Consolidated Data -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    
                    <!-- Linked POs -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0;">POs Vinculadas</h3>
                            <button id="btn-link-po" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                                <span class="material-icons-round" style="font-size: 1rem;">link</span> Vincular PO
                            </button>
                        </div>
                        ${linkedPOs.length > 0 ? `
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                                        <th style="padding: 0.5rem;">PO</th>
                                        <th style="padding: 0.5rem;">Status</th>
                                        <th style="padding: 0.5rem;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${linkedPOs.map(po => `
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td style="padding: 0.5rem;"><a href="#expedientes/${po.id}">${po.referenceNumber}</a></td>
                                            <td style="padding: 0.5rem;">${po.status}</td>
                                            <td style="padding: 0.5rem;">
                                                <button class="btn-unlink-po" data-id="${po.id}" style="color: #ef4444; border: none; background: none; cursor: pointer;">
                                                    <span class="material-icons-round">link_off</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color: var(--text-secondary);">No hay POs vinculadas a este embarque.</p>'}
                    </div>

                    <!-- Pedimento Management -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Gestión de Pedimento</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Número de Pedimento</label>
                                <input type="text" id="input-pedimento-number" value="${shipment.pedimentoNumber || ''}" placeholder="Ej: 350-7000123" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Archivo (PDF)</label>
                                <input type="file" id="input-pedimento-file" accept=".pdf" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>
                        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; gap: 1rem; margin-left: auto;">
                                <button id="btn-analyze-pedimento" class="btn" style="background: #8b5cf6; color: white; border: none;">
                                    <span class="material-icons-round" style="font-size: 1rem; margin-right: 0.5rem;">psychology</span> Analizar con IA
                                </button>
                                <button id="btn-save-pedimento" class="btn btn-primary">Guardar Pedimento</button>
                            </div>
                        </div>
                        
                        <!-- Analysis Results Container -->
                        <div id="analysis-results" style="margin-top: 1.5rem; display: none;"></div>
                    </div>

                    <!-- Consolidated Documents -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Documentación Consolidada</h3>
                        ${allDocs.length > 0 ? `
                            <ul style="list-style: none; padding: 0;">
                                ${allDocs.map(doc => `
                                    <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span class="material-icons-round" style="color: var(--primary-color);">description</span>
                                            <div>
                                                <div style="font-weight: 500;">${doc.type} <span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-body); padding: 2px 6px; border-radius: 4px;">${doc.poRef}</span></div>
                                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <a href="#" style="color: var(--text-secondary);"><span class="material-icons-round">download</span></a>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p style="color: var(--text-secondary);">No hay documentos en las POs vinculadas.</p>'}
                    </div>

                    <!-- Consolidated Costs -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Costos Consolidados</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Concepto</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">PO Ref</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Monto Orig.</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Total MXN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allCosts.map(cost => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 0.5rem;">${cost.type}</td>
                                        <td style="padding: 0.5rem;"><span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-body); padding: 2px 6px; border-radius: 4px;">${cost.poRef}</span></td>
                                        <td style="padding: 0.5rem;">${cost.amount.toLocaleString()} ${cost.currency}</td>
                                        <td style="padding: 0.5rem; font-weight: 500;">$${(cost.amount * cost.exchangeRate).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                `).join('')}
                                <tr style="background-color: var(--bg-body); font-weight: 600;">
                                    <td colspan="3" style="padding: 0.75rem;">TOTAL CONSOLIDADO</td>
                                    <td style="padding: 0.75rem;">$${totalPOCosts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Shipment Costs -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-icons-round" style="color: var(--primary-color);">attach_money</span>
                                Costos del Embarque
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
                                ${(shipment.costs || []).map(cost => `
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
                                    <td style="padding: 1rem 0.75rem; border-radius: 0 0 0 var(--radius-md);">TOTAL EMBARQUE</td>
                                    <td colspan="2"></td>
                                    <td style="padding: 1rem 0.75rem;">$${(shipment.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td style="border-radius: 0 0 var(--radius-md) 0;"></td>
                                </tr>
                            </tbody>
                        </table>
                        </table>
                    </div>

                    <!-- Proration Table -->
                    <div class="card">
                        <h3 style="margin-bottom: 1rem;">Prorrateo de Gastos por PO (Base Peso)</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">PO</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Peso (kg)</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">% Part.</th>
                                    <th style="padding: 0.5rem; color: var(--text-secondary);">Monto Asignado (MXN)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
                const totalWeight = linkedPOs.reduce((acc, po) => acc + (Number(po.grossWeight) || 0), 0);
                const totalShipmentCostMXN = (shipment.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);

                if (totalWeight === 0) return '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: var(--text-secondary);">No hay pesos registrados en las POs para calcular el prorrateo.</td></tr>';

                return linkedPOs.map(po => {
                    const weight = Number(po.grossWeight) || 0;
                    const share = weight / totalWeight;
                    const allocatedAmount = totalShipmentCostMXN * share;

                    return `
                                            <tr style="border-bottom: 1px solid var(--border-color);">
                                                <td style="padding: 0.5rem;"><a href="#expedientes/${po.id}">${po.referenceNumber}</a></td>
                                                <td style="padding: 0.5rem;">${weight.toLocaleString()} kg</td>
                                                <td style="padding: 0.5rem;">${(share * 100).toFixed(2)}%</td>
                                                <td style="padding: 0.5rem; font-weight: 600;">$${allocatedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        `;
                }).join('');
            })()}
                                <tr style="background-color: var(--bg-body); font-weight: 600;">
                                    <td colspan="3" style="padding: 0.75rem;">TOTAL ASIGNADO</td>
                                    <td style="padding: 0.75rem;">$${((shipment.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
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
                            <span style="color: var(--text-secondary);">Total POs:</span>
                            <strong>${linkedPOs.length}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-secondary);">Total Documentos:</span>
                            <strong>${allDocs.length}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <span style="font-weight: 600;">Total Gasto:</span>
                            <span style="font-weight: 700; color: var(--primary-color);">$${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>

                     <!-- Status Control -->
                     <div class="card">
                        <h3 style="margin-bottom: 1rem;">Estado del Embarque</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${Object.values(ShipmentStatus).map(status => {
                const isActive = shipment.status === status;
                let color = 'var(--primary-color)';
                if (status === 'OBSERVADO') color = '#f59e0b'; // Amber
                if (status === 'CERRADO') color = '#10b981'; // Emerald

                return `
                                <button class="btn-shipment-status" data-status="${status}" style="
                                    padding: 0.75rem; 
                                    text-align: left; 
                                    background: ${isActive ? color : 'transparent'}; 
                                    color: ${isActive ? 'white' : 'var(--text-main)'};
                                    border: 1px solid ${isActive ? color : 'var(--border-color)'}; 
                                    border-radius: var(--radius-md);
                                    cursor: pointer;
                                    font-weight: ${isActive ? '600' : '400'};
                                    transition: all 0.2s;
                                ">
                                    ${status}
                                </button>
                                `;
            }).join('')}
                        </div>
                     </div>
                </div>

            </div>
            <div id="modal-container"></div>
            </div>
        `;
    }

    renderAnalysisResults(data) {
        const container = document.getElementById('analysis-results');
        if (!container) return;

        container.style.display = 'block';

        const statusColors = {
            'CORRECTO': '#10b981', // Green
            'CON OBSERVACIONES': '#f59e0b', // Amber
            'CRÍTICO': '#ef4444' // Red
        };
        const statusColor = statusColors[data.generalStatus] || '#6b7280';

        const findingsHtml = data.findings.map(f => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem; font-weight: 500;">${f.item}</td>
                <td style="padding: 0.75rem;">${f.type}</td>
                <td style="padding: 0.75rem;">${f.description}</td>
                <td style="padding: 0.75rem;">
                    <span style="
                        padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500;
                        background: ${f.risk === 'Alto' ? '#fee2e2' : f.risk === 'Medio' ? '#fef3c7' : '#d1fae5'};
                        color: ${f.risk === 'Alto' ? '#b91c1c' : f.risk === 'Medio' ? '#b45309' : '#047857'};
                    ">${f.risk}</span>
                </td>
                <td style="padding: 0.75rem; color: var(--text-secondary);">${f.recommendation}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
                <div style="background: ${statusColor}15; padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-icons-round" style="color: ${statusColor};">analytics</span>
                        <h4 style="color: ${statusColor}; margin: 0;">${data.generalStatus}</h4>
                    </div>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">Análisis IA</span>
                </div>
                
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.5;">${data.summary}</p>
                    
                    <h5 style="margin-bottom: 1rem;">Hallazgos Detallados</h5>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="text-align: left; border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 0.75rem;">Item</th>
                                    <th style="padding: 0.75rem;">Tipo</th>
                                    <th style="padding: 0.75rem;">Descripción</th>
                                    <th style="padding: 0.75rem;">Riesgo</th>
                                    <th style="padding: 0.75rem;">Recomendación</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${findingsHtml.length > 0 ? findingsHtml : '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Sin hallazgos relevantes.</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: var(--radius-md);">
                        <h5 style="margin-bottom: 0.5rem;">Conclusión y Acciones</h5>
                        <p style="color: var(--text-secondary); margin-bottom: 0;">${data.conclusion}</p>
                    </div>
                </div>
            </div>
        `;
    }

}
