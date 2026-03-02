import { ImportFile, ImportStatus, Supplier, Material } from '../models.js';

export class ExpedientesView {
    constructor(store) {
        this.store = store;
    }

    // --- LIST VIEW ---
    render() {
        const files = this.store.getAll('importFiles');
        const suppliers = this.store.getAll('suppliers');

        return `
            <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="margin-bottom: 0.5rem;">Expedientes de Importación (POs)</h2>
                    <p style="color: var(--text-secondary);">Seguimiento de órdenes y embarques.</p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button id="btn-new-import" class="btn btn-primary">
                        <span class="material-icons-round">add</span>
                        Nuevo Expediente
                    </button>
                    <input type="file" id="file-upload-excel" accept=".xlsx, .xls" style="display: none;">
                    <button id="btn-import-excel" class="btn" style="background-color: #107c41; color: white; border: none;">
                        <span class="material-icons-round">upload_file</span>
                        Importar Excel
                    </button>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="position: relative;">
                    <span class="material-icons-round" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">search</span>
                    <input type="text" id="search-expedientes" placeholder="Buscar por PO, Proveedor, Estatus..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <div class="card">
                ${files.length === 0 ? this.getEmptyState() : this.getTable(files, suppliers)}
            </div>

            <div id="modal-container"></div>
        `;
    }

    getEmptyState() {
        return `
            <div style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;">folder_open</span>
                <h3 style="margin-bottom: 0.5rem;">Sin expedientes activos</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Crea un nuevo expediente para iniciar el seguimiento.</p>
            </div>
        `;
    }

    getTable(files, suppliers) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">PO Number</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Proveedor</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">MOT</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Estado</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">ETA</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${files.map(f => {
            const supplier = suppliers.find(s => s.id === f.supplierId);
            return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 1rem; font-weight: 600;">
                                <a href="#expedientes/${f.id}" style="text-decoration: none; color: var(--primary-color);">${f.referenceNumber}</a>
                            </td>
                            <td style="padding: 1rem;">${supplier ? supplier.name : 'Unknown'}</td>
                            <td style="padding: 1rem;">${f.mot || '-'}</td>
                            <td style="padding: 1rem;">${this.getStatusBadge(f.status)}</td>
                            <td style="padding: 1rem;">${f.eta ? new Date(f.eta).toLocaleDateString() : '-'}</td>
                            <td style="padding: 1rem;">
                                <a href="#expedientes/${f.id}" class="btn-icon" style="text-decoration: none; color: var(--text-secondary); margin-right: 0.5rem;">
                                    <span class="material-icons-round">visibility</span>
                                </a>
                                </button>
                                <button class="btn-icon btn-delete-import" data-id="${f.id}" style="background: none; border: none; cursor: pointer; color: #ef4444;">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
        }).join('')}
                </tbody>
            </table>
        `;
    }

    getStatusBadge(status) {
        const colors = {
            // Standard
            [ImportStatus.DOCUMENTACION]: 'var(--status-ordered)',
            [ImportStatus.INSTRUCCION]: 'var(--status-ordered)',
            [ImportStatus.REFERENCIA]: 'var(--status-transit)',
            [ImportStatus.ETA]: 'var(--status-transit)',
            [ImportStatus.PREVIO_PEDIMENTO]: 'var(--status-customs)',
            [ImportStatus.RECOLECCION]: 'var(--status-transit)',
            [ImportStatus.DESPACHO]: 'var(--status-customs)',
            [ImportStatus.ARRIBO]: 'var(--status-released)',
            [ImportStatus.ARRIBO_DBS]: 'var(--status-warehouse)',

            // Exceptions
            [ImportStatus.RETORNO]: '#ef4444', // Red
            [ImportStatus.ABANDONO]: '#ef4444',
            [ImportStatus.RECHAZO]: '#ef4444',
            [ImportStatus.NO_LLEGO]: '#f59e0b', // Amber
            [ImportStatus.INSPECCION]: '#f97316', // Orange
            [ImportStatus.DETENIDA]: '#ef4444'
        };

        const labels = {
            [ImportStatus.DOCUMENTACION]: 'Documentación',
            [ImportStatus.INSTRUCCION]: 'Envío de Instrucción',
            [ImportStatus.REFERENCIA]: 'Referencia',
            [ImportStatus.ETA]: 'ETA',
            [ImportStatus.PREVIO_PEDIMENTO]: 'Previo y Pedimento',
            [ImportStatus.RECOLECCION]: 'Recolección',
            [ImportStatus.DESPACHO]: 'Despacho',
            [ImportStatus.ARRIBO]: 'Arribo',
            [ImportStatus.ARRIBO_DBS]: 'Arribo DBS',
            [ImportStatus.RETORNO]: 'Retorno',
            [ImportStatus.ABANDONO]: 'Abandono',
            [ImportStatus.RECHAZO]: 'Rechazo',
            [ImportStatus.NO_LLEGO]: 'No Llegó',
            [ImportStatus.INSPECCION]: 'Inspección Aduanal',
            [ImportStatus.DETENIDA]: 'Detenida por Inventario'
        };

        const color = colors[status] || '#94a3b8';
        const label = labels[status] || status;

        // Use border style to support both CSS variables and hex codes safely
        return `<span style="background-color: var(--bg-surface); color: ${color}; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 500; border: 1px solid ${color};">${label}</span>`;
    }

    openCreateModal() {
        const suppliers = this.store.getAll('suppliers');
        const materials = this.store.getAll('materials');
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem;">Nuevo Expediente</h3>
                    <form id="form-import">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">PO Number / Referencia</label>
                                <input type="text" name="referenceNumber" required placeholder="Ej: IMP-2023-001" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Proveedor</label>
                                <select name="supplierId" id="select-supplier" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="">Seleccionar Proveedor...</option>
                                    ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Incoterm</label>
                                <select name="incoterms" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="">Seleccionar...</option>
                                    <option value="EXW">EXW - Ex Works</option>
                                    <option value="FCA">FCA - Free Carrier</option>
                                    <option value="FOB">FOB - Free On Board</option>
                                    <option value="CIF">CIF - Cost, Insurance & Freight</option>
                                    <option value="DAP">DAP - Delivered At Place</option>
                                    <option value="DDP">DDP - Delivered Duty Paid</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Lugar Incoterm</label>
                                <input type="text" name="incotermsPlace" placeholder="Ej: Shanghai Port" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">País de Origen</label>
                                <input type="text" name="countryOrigin" placeholder="Ej: China" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Medio de Transporte</label>
                                <select name="mot" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="">Seleccionar...</option>
                                    <option value="MARITIMO">MARITIMO</option>
                                    <option value="AEREO">AEREO</option>
                                    <option value="TERRESTRE">TERRESTRE</option>
                                    <option value="FERROVIARIO">FERROVIARIO</option>
                                </select>
                            </div>
                        </div>

                        <div style="padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                            <h4 style="margin-bottom: 0.75rem; font-size: 0.875rem;">Detalle del Material</h4>
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Material</label>
                                <select name="materialId" id="select-material" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                    <option value="">Seleccionar Material...</option>
                                    ${materials.map(m => `<option value="${m.id}" data-supplier="${m.supplierId}">${m.sku} - ${m.description}</option>`).join('')}
                                </select>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Cantidad</label>
                                    <input type="number" name="quantity" required min="0.01" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Valor Neto</label>
                                    <input type="number" name="netOrderValue" required min="0.01" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Moneda</label>
                                    <select name="currency" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                        <option value="USD">USD</option>
                                        <option value="MXN">MXN</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Crear Expediente</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const selectSupplier = document.getElementById('select-supplier');
        const selectMaterial = document.getElementById('select-material');

        // Store original options
        const allMaterialOptions = Array.from(selectMaterial.options);

        selectSupplier.addEventListener('change', (e) => {
            const supplierId = e.target.value;
            selectMaterial.innerHTML = '<option value="">Seleccionar Material...</option>';

            if (supplierId) {
                const filtered = allMaterialOptions.filter(opt => opt.dataset.supplier === supplierId);
                filtered.forEach(opt => selectMaterial.appendChild(opt));
            }
        });

        document.getElementById('btn-cancel').addEventListener('click', () => modalContainer.innerHTML = '');

        document.getElementById('form-import').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            import('../models.js').then(({ ImportFile }) => {
                const newFile = new ImportFile({
                    referenceNumber: formData.get('referenceNumber'),
                    supplierId: formData.get('supplierId'),
                    incoterms: formData.get('incoterms'),
                    incotermsPlace: formData.get('incotermsPlace'),
                    countryOrigin: formData.get('countryOrigin'),
                    mot: formData.get('mot'),
                    netOrderValue: Number(formData.get('netOrderValue')),
                    currency: formData.get('currency')
                });

                // Add Item
                newFile.items.push({
                    materialId: formData.get('materialId'),
                    quantity: Number(formData.get('quantity'))
                });

                this.store.add('importFiles', newFile);
                modalContainer.innerHTML = '';
                window.dispatchEvent(new Event('view-update'));
            });
        });
    }

    async handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                this.processExcelData(jsonData);
            } catch (error) {
                console.error('Error parsing Excel:', error);
                alert('Error al leer el archivo Excel. Asegúrate de que el formato sea correcto.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async processExcelData(rows) {
        let stats = {
            newPOs: 0,
            updatedPOs: 0,
            newMaterials: 0,
            newSuppliers: 0
        };

        // Batch containers
        const newSuppliers = [];
        const newMaterials = [];
        const newImportFiles = [];
        const updatedImportFiles = [];

        // Helper to find in store or in batch
        const findSupplier = (name) => {
            const normalized = name.toLowerCase();
            return this.store.getAll('suppliers').find(s => s.name.toLowerCase() === normalized) ||
                newSuppliers.find(s => s.name.toLowerCase() === normalized);
        };

        const findMaterial = (sku) => {
            return this.store.getAll('materials').find(m => m.sku === sku) ||
                newMaterials.find(m => m.sku === sku);
        };

        const findFile = (ref) => {
            return this.store.getAll('importFiles').find(f => f.referenceNumber === ref) ||
                newImportFiles.find(f => f.referenceNumber === ref);
        };

        if (rows.length > 0) {
            console.log('Excel Columns Found:', Object.keys(rows[0]));
        } else {
            console.warn('Excel file is empty or no rows found.');
            alert('El archivo Excel parece estar vacío.');
            return;
        }

        rows.forEach((row, index) => {
            // Debug first 5 rows
            if (index < 5) console.log(`Processing Row ${index}:`, row);
            // 1. Supplier
            let supplierId = null;
            const supplierNameRaw = row['Vendor/supplying plant'];
            if (supplierNameRaw) {
                const supplierName = String(supplierNameRaw).replace(/^\d+\s+/, '').trim();
                let supplier = findSupplier(supplierName);

                if (!supplier) {
                    supplier = new Supplier({ name: supplierName });
                    newSuppliers.push(supplier);
                    stats.newSuppliers++;
                }
                supplierId = supplier.id;
            }

            // 2. Material
            let materialId = null;
            const sku = row['Material'] ? String(row['Material']).trim() : null;
            if (sku) {
                let material = findMaterial(sku);
                if (!material) {
                    material = new Material({
                        sku: sku,
                        description: row['Short Text'] || 'No Description',
                        hsCode: row['CTN / HS Code'] ? String(row['CTN / HS Code']).trim() : '',
                        uom: row['Order Unit'] || 'EA',
                        supplierId: supplierId
                    });
                    newMaterials.push(material);
                    stats.newMaterials++;
                }
                materialId = material.id;
            }

            // 3. PO (ImportFile)
            const poNumber = row['Purchasing Document'] ? String(row['Purchasing Document']).trim() : null;
            if (poNumber) {
                let file = findFile(poNumber);

                // Calculate Weight
                let weight = Number(row['Gross Weight']) || Number(row['Weight']) || 0;
                if (weight === 0 && String(row['Order Unit']).toUpperCase() === 'KG') {
                    weight = Number(row['Order Quantity']) || 0;
                }

                // Parse Delivery Date
                const keys = Object.keys(row);
                const firstKey = keys.length > 0 ? keys[0] : null;
                let deliveryDate = firstKey ? row[firstKey] : null;

                if (typeof deliveryDate === 'number') {
                    const date = new Date((deliveryDate - 25569) * 86400 * 1000);
                    deliveryDate = date.toISOString();
                } else if (deliveryDate) {
                    let date = new Date(deliveryDate);
                    if (isNaN(date.getTime()) && typeof deliveryDate === 'string') {
                        const parts = deliveryDate.split(/[./-]/);
                        if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            if (day > 0 && day <= 31 && month >= 0 && month < 12 && year > 1900) {
                                date = new Date(year, month, day);
                            }
                        }
                    }
                    if (!isNaN(date.getTime())) {
                        deliveryDate = date.toISOString();
                    } else {
                        deliveryDate = null;
                    }
                }

                const poData = {
                    incoterms: row['Incoterms'] || '',
                    incotermsPlace: row['Incoterms (Part 2)'] || '',
                    countryOrigin: row['Country'] || '',
                    netOrderValue: row['Net Order Value'] || 0,
                    currency: row['Currency'] || 'USD',
                    mot: row['Description'] || '',
                    grossWeight: weight,
                    ata: deliveryDate,
                    plantArrivalDate: deliveryDate
                };

                if (!file) {
                    file = new ImportFile({
                        referenceNumber: poNumber,
                        supplierId: supplierId,
                        ...poData
                    });
                    newImportFiles.push(file);
                    stats.newPOs++;
                } else {
                    const existingUpdate = updatedImportFiles.find(u => u.id === file.id);
                    if (existingUpdate) {
                        Object.assign(existingUpdate, poData);
                    } else {
                        updatedImportFiles.push({ id: file.id, ...poData });
                    }
                    Object.assign(file, poData);
                    stats.updatedPOs++;
                }

                // 4. Add/Update Item to PO
                const quantity = Number(row['Order Quantity']) || 0;
                const netPrice = Number(row['Net price']) || 0;

                if (materialId) {
                    if (!file.items) file.items = [];

                    const existingItemIndex = file.items.findIndex(i => i.materialId === materialId);

                    if (existingItemIndex !== -1) {
                        file.items[existingItemIndex] = {
                            ...file.items[existingItemIndex],
                            quantity: quantity,
                            netPrice: netPrice,
                            uom: row['Order Unit']
                        };
                    } else {
                        file.items.push({
                            materialId: materialId,
                            quantity: quantity,
                            netPrice: netPrice,
                            uom: row['Order Unit']
                        });
                    }

                    const existingUpdate = updatedImportFiles.find(u => u.id === file.id);
                    if (existingUpdate) {
                        existingUpdate.items = file.items;
                    } else {
                        if (!newImportFiles.includes(file)) {
                            updatedImportFiles.push({ id: file.id, items: file.items });
                        }
                    }
                }
            }
        });

        // Commit Batches (Sequentially to respect Foreign Keys)
        if (newSuppliers.length > 0) await this.store.addBatch('suppliers', newSuppliers);
        if (newMaterials.length > 0) await this.store.addBatch('materials', newMaterials);
        if (newImportFiles.length > 0) await this.store.addBatch('importFiles', newImportFiles);
        if (updatedImportFiles.length > 0) await this.store.updateBatch('importFiles', updatedImportFiles);

        console.log('Excel Import Stats:', stats);
        alert(`Importación completada:\nPOs Nuevas: ${stats.newPOs}\nPOs Actualizadas: ${stats.updatedPOs}\nMateriales Nuevos: ${stats.newMaterials}\nProveedores Nuevos: ${stats.newSuppliers}`);

        window.dispatchEvent(new Event('view-update'));
    }

    openAddCostModal(fileId) {
        const modalContainer = document.getElementById('modal-container');
        const concepts = [
            'Flete Internacional', 'Flete Nacional', 'Transfer', 'Serv Logistico', 'Maniobras',
            'Almacenajes', 'Demoras', 'Honorários', 'DTA', 'Prevalidacion',
            'Limpieza de Contenedor', 'Desconsolidación', 'Aduana', 'Custom',
            'Gastos no Comprobables', 'Otros Incrementables', 'Inspeccion',
            'Reconocim', 'Seguro', 'Servicio'
        ];

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Agregar Costo</h3>
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
            const file = fileInput.files[0];

            // Helper to save cost
            const saveCost = (pdfUrl = null, fileName = null) => {
                import('../models.js').then(({ CostRecord }) => {
                    const newCost = new CostRecord({
                        type: formData.get('type'),
                        amount: formData.get('amount'),
                        currency: formData.get('currency'),
                        exchangeRate: formData.get('exchangeRate'),
                        pdfUrl: pdfUrl,
                        fileName: fileName
                    });

                    this.store.addCost('importFiles', fileId, newCost).then(() => {
                        modalContainer.innerHTML = '';
                        // Refresh view
                        const container = document.getElementById('view-container');
                        container.innerHTML = this.renderDetail(fileId);
                        this.attachDetailEvents(fileId);
                    });
                });
            };

            if (file) {
                // Check size
                if (file.size > 5 * 1024 * 1024) {
                    alert('Advertencia: El archivo es grande (> 5MB). Podría fallar al guardar.');
                }

                const reader = new FileReader();
                reader.onload = (evt) => {
                    saveCost(evt.target.result, file.name);
                };
                reader.readAsDataURL(file);
            } else {
                saveCost();
            }
        });
    }

    openEditModal(file) {
        const suppliers = this.store.getAll('suppliers');
        const materials = this.store.getAll('materials');
        const currentItem = file.items && file.items.length > 0 ? file.items[0] : null;
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Editar Expediente</h3>
                    <form id="form-edit-import">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">PO Number / Referencia</label>
                            <input type="text" name="referenceNumber" value="${file.referenceNumber}" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Proveedor</label>
                            <select name="supplierId" id="select-supplier-edit" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                ${suppliers.map(s => `<option value="${s.id}" ${s.id === file.supplierId ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>

                        <div style="padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                            <h4 style="margin-bottom: 0.75rem; font-size: 0.875rem;">Detalle del Material</h4>
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Material</label>
                                <select name="materialId" id="select-material-edit" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                    <option value="">Seleccionar Material...</option>
                                    ${materials.filter(m => m.supplierId === file.supplierId).map(m =>
            `<option value="${m.id}" ${currentItem && m.id === currentItem.materialId ? 'selected' : ''}>${m.sku} - ${m.description}</option>`
        ).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Cantidad</label>
                                <input type="number" name="quantity" value="${currentItem ? currentItem.quantity : ''}" required min="0.01" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                            </div>
                        </div>

                        <div style="padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                            <h4 style="margin-bottom: 0.75rem; font-size: 0.875rem;">Información Comercial</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Incoterms</label>
                                    <input type="text" name="incoterms" value="${file.incoterms || ''}" placeholder="Ej. FCA" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Lugar Incoterms</label>
                                    <input type="text" name="incotermsPlace" value="${file.incotermsPlace || ''}" placeholder="Ej. Laredo" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">País Origen</label>
                                    <input type="text" name="countryOrigin" value="${file.countryOrigin || ''}" placeholder="Ej. US" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Valor Neto</label>
                                    <input type="number" name="netOrderValue" value="${file.netOrderValue || ''}" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">Moneda</label>
                                    <input type="text" name="currency" value="${file.currency || 'USD'}" placeholder="Ej. USD" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel-edit" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
            `;

        // Filter logic for edit modal
        const selectSupplier = document.getElementById('select-supplier-edit');
        const selectMaterial = document.getElementById('select-material-edit');

        // Pre-populate all options in memory to filter later
        const allMaterials = materials;

        selectSupplier.addEventListener('change', (e) => {
            const supplierId = e.target.value;
            selectMaterial.innerHTML = '<option value="">Seleccionar Material...</option>';

            const filtered = allMaterials.filter(m => m.supplierId === supplierId);
            if (filtered.length > 0) {
                filtered.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m.id;
                    option.textContent = `${m.sku} - ${m.description} `;
                    selectMaterial.appendChild(option);
                });
            } else {
                selectMaterial.innerHTML += '<option value="" disabled>No hay materiales para este proveedor</option>';
            }
        });

        document.getElementById('btn-cancel-edit').addEventListener('click', () => modalContainer.innerHTML = '');

        document.getElementById('form-edit-import').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const updatedItems = [{
                materialId: formData.get('materialId'),
                quantity: Number(formData.get('quantity'))
            }];

            this.store.update('importFiles', file.id, {
                referenceNumber: formData.get('referenceNumber'),
                supplierId: formData.get('supplierId'),
                items: updatedItems,
                // New fields
                incoterms: formData.get('incoterms'),
                incotermsPlace: formData.get('incotermsPlace'),
                countryOrigin: formData.get('countryOrigin'),
                netOrderValue: Number(formData.get('netOrderValue')),
                currency: formData.get('currency')
            });

            modalContainer.innerHTML = '';
            window.dispatchEvent(new Event('view-update'));
        });
    }

    // --- DETAIL VIEW ---
    renderDetail(id) {
        const file = this.store.getById('importFiles', id);
        if (!file) return '<div class="card">Expediente no encontrado</div>';

        const supplier = this.store.getById('suppliers', file.supplierId);
        const material = file.items && file.items.length > 0 ? this.store.getById('materials', file.items[0].materialId) : null;
        const quantity = file.items && file.items.length > 0 ? file.items[0].quantity : 0;

        return `
            <div style="max-width: 1200px; margin: 0 auto;">
                <!--Header & Navigation-->
                <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <a href="#expedientes" style="text-decoration: none; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500; transition: color 0.2s;">
                        <span class="material-icons-round" style="font-size: 1.25rem;">arrow_back</span> Volver a la lista
                    </a>
                    <div style="display: flex; gap: 0.5rem;">
                         <button class="btn-icon btn-edit-import" data-id="${file.id}" style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-main); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                            <span class="material-icons-round">edit</span>
                        </button>
                    </div>
                </div>

                <!--Main Header Card-->
                <div class="card" style="margin-bottom: 2rem; border-left: 5px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h1 style="font-size: 2.5rem; margin: 0; font-weight: 700; letter-spacing: -0.02em;">${file.referenceNumber}</h1>
                                ${this.getStatusBadge(file.status)}
                            </div>
                            <div style="display: flex; align-items: center; gap: 2rem; color: var(--text-secondary); font-size: 0.95rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-icons-round" style="font-size: 1.25rem;">store</span>
                                    <span>${supplier ? supplier.name : 'Proveedor Desconocido'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-icons-round" style="font-size: 1.25rem;">inventory_2</span>
                                    <span>${material ? material.sku : '-'} - ${material ? material.description : ''} (${quantity} ${material ? material.uom : ''})</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Valor Total Estimado</div>
                             <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">
                                ${file.currency || 'USD'} ${Number(file.netOrderValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                             </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                         ${this.getProgressBar(file.status)}
                    </div>
                </div>

                ${(() => {
                // Regulation Check Logic
                const materials = this.store.getAll('materials');
                const regulationWarnings = [];

                if (file.items && file.items.length > 0) {
                    file.items.forEach(item => {
                        const material = materials.find(m => m.id === item.materialId);
                        if (material && material.regulations) {
                            regulationWarnings.push({
                                sku: material.sku,
                                regulation: material.regulations
                            });
                        }
                    });
                }

                if (regulationWarnings.length > 0) {
                    return `
                            <div class="card" style="background-color: #fff7ed; border-left: 4px solid #f97316; margin-bottom: 2rem;">
                                <div style="display: flex; align-items: start; gap: 1rem;">
                                    <span class="material-icons-round" style="color: #f97316; font-size: 2rem;">warning</span>
                                    <div>
                                        <h3 style="color: #9a3412; margin-bottom: 0.5rem;">Atención: Regulaciones Requeridas</h3>
                                        <p style="color: #c2410c; margin-bottom: 1rem;">Este expediente contiene materiales que requieren permisos:</p>
                                        <ul style="list-style: none; padding: 0; display: grid; gap: 0.5rem;">
                                            ${regulationWarnings.map(w => `
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

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                    <!-- Left Column: Details -->
                    <div style="display: flex; flex-direction: column; gap: 2rem;">
                        
                        <!-- Shipment Details -->
                        <div class="card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-icons-round" style="color: var(--primary-color);">local_shipping</span>
                                    Detalles Logísticos
                                </h3>
                                <button id="btn-save-details" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">Guardar Cambios</button>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                                <div style="grid-column: span 2;">
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 500;">Modo de Transporte (MOT)</label>
                                    <input type="text" id="input-mot" value="${file.mot || ''}" placeholder="Ej. MARITIMO, AEREO, TERRESTRE" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-main);">
                                </div>
                                <div>
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 500;">ETA (Estimado de Arribo)</label>
                                    <input type="date" id="input-eta" value="${file.eta ? file.eta.split('T')[0] : ''}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-main);">
                                </div>
                                <div>
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 500;">Arribo a Planta</label>
                                    <input type="date" id="input-ata" value="${file.ata ? file.ata.split('T')[0] : ''}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-main);">
                                </div>
                                <div>
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 500;">Arribo DBS</label>
                                    <input type="date" id="input-ata-dbs" value="${file.ataDBS ? file.ataDBS.split('T')[0] : ''}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-main);">
                                </div>
                            </div>

                            <h4 style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Información Aduanal</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                                <div>
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Pedimento</label>
                                    <input type="text" id="input-pedimento" value="${file.pedimento || ''}" placeholder="Ej. 23  47  3920  8001234" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                </div>
                                <div>
                                    <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Agente Aduanal</label>
                                    <input type="text" id="input-broker" value="${file.customsBroker || ''}" placeholder="Nombre AA" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                </div>
                            </div>

                            <div style="background: var(--bg-body); padding: 1rem; border-radius: var(--radius-md);">
                                <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Estatus Regulatorio (COFEPRIS/SEMARNAT)</label>
                                <select id="input-regulatory" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white;">
                                    <option value="PENDING" ${file.regulatoryStatus === 'PENDING' ? 'selected' : ''}>⏳ Pendiente de Revisión</option>
                                    <option value="APPROVED" ${file.regulatoryStatus === 'APPROVED' ? 'selected' : ''}>✅ Aprobado / Cumple</option>
                                    <option value="REJECTED" ${file.regulatoryStatus === 'REJECTED' ? 'selected' : ''}>❌ Rechazado / Bloqueado</option>
                                </select>
                            </div>
                        </div>

                        <!-- Commercial Info (Read Only) -->
                        <div class="card">
                            <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-icons-round" style="color: var(--primary-color);">receipt_long</span>
                                Datos Comerciales
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Incoterms</div>
                                    <div style="font-weight: 600; font-size: 1rem;">${file.incoterms || '-'} <span style="font-weight: 400; color: var(--text-secondary);">${file.incotermsPlace || ''}</span></div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">País de Origen</div>
                                    <div style="font-weight: 600; font-size: 1rem;">${file.countryOrigin || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Moneda</div>
                                    <div style="font-weight: 600; font-size: 1rem;">${file.currency || 'USD'}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Documents Section -->
                        <div class="card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-icons-round" style="color: var(--primary-color);">folder</span>
                                    Documentos
                                </h3>
                                <button id="btn-add-doc" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                    <span class="material-icons-round" style="font-size: 1rem;">upload</span> Subir
                                </button>
                                <input type="file" id="input-doc-file" accept=".pdf,.doc,.docx,.jpg,.png" style="display: none;">
                            </div>
                            
                            ${file.documents && file.documents.length > 0 ? `
                                <div style="display: grid; gap: 0.75rem;">
                                    ${file.documents.map((doc, idx) => `
                                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                            <div style="display: flex; align-items: center; gap: 1rem;">
                                                <div style="background: white; padding: 0.5rem; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                                    <span class="material-icons-round" style="color: var(--primary-color);">description</span>
                                                </div>
                                                <div>
                                                    <div style="font-weight: 600; color: var(--text-main);">${doc.type}</div>
                                                    ${doc.name ? `<div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 0.1rem;">${doc.name}</div>` : ''}
                                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Subido el ${doc.date ? new Date(doc.date).toLocaleDateString() : '-'}</div>
                                                </div>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                <button class="btn-icon btn-view-doc" data-id="${doc.id}" title="Ver Documento" style="border: none; background: transparent; color: var(--primary-color); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">visibility</span>
                                                </button>
                                                <button class="btn-icon btn-download-doc" data-id="${doc.id}" data-name="${doc.name || 'documento'}" title="Descargar" style="border: none; background: transparent; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">download</span>
                                                </button>
                                                <button class="btn-icon btn-delete-doc" data-idx="${idx}" title="Eliminar" style="border: none; background: transparent; color: #ef4444; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s;">
                                                    <span class="material-icons-round" style="font-size: 1.25rem;">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div style="text-align: center; padding: 3rem; border: 2px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-body);">
                                    <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 1rem;">cloud_upload</span>
                                    <p style="color: var(--text-secondary); margin: 0;">No hay documentos cargados aún.</p>
                                </div>
                            `}
                        </div>

                        <!-- Costs Section -->
                        <div class="card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-icons-round" style="color: var(--primary-color);">attach_money</span>
                                    Costos y Landed Cost
                                </h3>
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="file" id="file-upload-pdf" accept="application/pdf" style="display: none;">
                                        <button id="btn-analyze-pdf" class="btn" style="padding: 0.5rem 1rem; font-size: 0.875rem; background: white; border: 1px solid var(--border-color); color: var(--text-main);">
                                            <span class="material-icons-round" style="font-size: 1rem;">analytics</span> Analizar PDF
                                        </button>
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
                                    ${(file.costs || []).map(cost => `
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
                                                    <button class="btn-icon btn-view-cost" data-url="${cost.pdfUrl}" title="Visualizar" style="border: none; background: transparent; text-decoration: none; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s; cursor: pointer;">
                                                        <span class="material-icons-round" style="font-size: 1.25rem;">visibility</span>
                                                    </button>
                                                    <button class="btn-icon btn-download-cost" data-url="${cost.pdfUrl}" data-name="${cost.fileName || 'costo'}" title="Descargar" style="border: none; background: transparent; text-decoration: none; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s; cursor: pointer;">
                                                        <span class="material-icons-round" style="font-size: 1.25rem;">download</span>
                                                    </button>
                                                    ` : ''}
                                                    <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Eliminar" style="border: none; background: transparent; color: #ef4444; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s;">
                                                        <span class="material-icons-round" style="font-size: 1.25rem;">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    <tr style="background-color: var(--bg-body); font-weight: 700; color: var(--text-main);">
                                        <td style="padding: 1rem 0.75rem; border-radius: 0 0 0 var(--radius-md);">TOTAL LANDED COST</td>
                                        <td colspan="2"></td>
                                        <td style="padding: 1rem 0.75rem;">$${(file.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td style="border-radius: 0 0 var(--radius-md) 0;"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right Column: Status Control -->
                    <div style="display: flex; flex-direction: column; gap: 2rem;">
                        <div class="card" style="position: sticky; top: 2rem;">
                            <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-icons-round" style="color: var(--primary-color);">update</span>
                                Actualizar Estado
                            </h3>

                            <div style="margin-bottom: 2rem;">
                                <h4 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Flujo Normal</h4>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    ${[
                ImportStatus.DOCUMENTACION,
                ImportStatus.INSTRUCCION,
                ImportStatus.REFERENCIA,
                ImportStatus.ETA,
                ImportStatus.PREVIO_PEDIMENTO,
                ImportStatus.RECOLECCION,
                ImportStatus.DESPACHO,
                ImportStatus.ARRIBO,
                ImportStatus.ARRIBO_DBS
            ].map(status => this.renderStatusButton(status, file.status)).join('')}
                                </div>
                            </div>

                            <div>
                                <h4 style="font-size: 0.75rem; color: #ef4444; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Incidencias</h4>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    ${[
                ImportStatus.RETORNO,
                ImportStatus.ABANDONO,
                ImportStatus.RECHAZO,
                ImportStatus.NO_LLEGO,
                ImportStatus.INSPECCION,
                ImportStatus.DETENIDA
            ].map(status => this.renderStatusButton(status, file.status, true)).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="modal-container"></div>
        `;
    }

    renderStatusButton(status, currentStatus, isException = false) {
        const isActive = status === currentStatus;
        const labels = {
            [ImportStatus.DOCUMENTACION]: 'Documentación',
            [ImportStatus.INSTRUCCION]: 'Envío de Instrucción',
            [ImportStatus.REFERENCIA]: 'Referencia',
            [ImportStatus.ETA]: 'ETA',
            [ImportStatus.PREVIO_PEDIMENTO]: 'Previo y Pedimento',
            [ImportStatus.RECOLECCION]: 'Recolección',
            [ImportStatus.DESPACHO]: 'Despacho',
            [ImportStatus.ARRIBO]: 'Arribo',
            [ImportStatus.ARRIBO_DBS]: 'Arribo DBS',
            [ImportStatus.RETORNO]: 'Retorno',
            [ImportStatus.ABANDONO]: 'Abandono',
            [ImportStatus.RECHAZO]: 'Rechazo',
            [ImportStatus.NO_LLEGO]: 'No Llegó',
            [ImportStatus.INSPECCION]: 'Inspección Aduanal',
            [ImportStatus.DETENIDA]: 'Detenida por Inventario'
        };

        const baseColor = isException ? '#ef4444' : 'var(--primary-color)';
        const activeBg = isException ? '#ef4444' : 'var(--primary-color)';
        const activeText = 'white';
        const inactiveText = isException ? '#ef4444' : 'var(--text-main)';

        return `
            <button class="btn-status-update" data-status="${status}" style="
        padding: 0.75rem;
        text-align: left;
        background: ${isActive ? activeBg : 'transparent'};
        color: ${isActive ? activeText : inactiveText};
        border: 1px solid ${isActive ? activeBg : 'var(--border-color)'};
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: ${isActive ? '600' : '400'};
        transition: all 0.2s;
        ">
                ${labels[status] || status}
            </button>
            `;
    }

    getProgressBar(currentStatus) {
        const steps = [
            ImportStatus.DOCUMENTACION,
            ImportStatus.INSTRUCCION,
            ImportStatus.REFERENCIA,
            ImportStatus.ETA,
            ImportStatus.PREVIO_PEDIMENTO,
            ImportStatus.RECOLECCION,
            ImportStatus.DESPACHO,
            ImportStatus.ARRIBO,
            ImportStatus.ARRIBO_DBS
        ];

        const currentIndex = steps.indexOf(currentStatus);

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; position: relative; margin-bottom: 2rem;">
            <!--Line -->
            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: var(--border-color); z-index: 0;"></div>
            <div style="position: absolute; top: 50%; left: 0; width: ${(currentIndex / (steps.length - 1)) * 100}%; height: 2px; background: var(--primary-color); z-index: 0; transition: width 0.5s ease;"></div>

            ${steps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return `
                <div style="position: relative; z-index: 1; background: var(--bg-body); padding: 0 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <div style="
                        width: 2rem; 
                        height: 2rem; 
                        border-radius: 50%; 
                        background: ${isCompleted ? 'var(--primary-color)' : 'var(--bg-surface)'}; 
                        border: 2px solid ${isCompleted ? 'var(--primary-color)' : 'var(--border-color)'};
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        color: ${isCompleted ? 'white' : 'var(--text-secondary)'};
                        font-weight: 600;
                        font-size: 0.875rem;
                        transition: all 0.3s ease;
                    ">
                        ${isCompleted ? '<span class="material-icons-round" style="font-size: 1.25rem;">check</span>' : index + 1}
                    </div>
                    <div style="font-size: 0.75rem; font-weight: ${isCurrent ? '600' : '400'}; color: ${isCurrent ? 'var(--text-main)' : 'var(--text-secondary)'}; max-width: 80px; text-align: center;">
                        ${step}
                    </div>
                </div>
            `;
        }).join('')
            }
        </div>
            `;
    }

    // Helper to convert Data URI to Blob
    dataURItoBlob(dataURI) {
        try {
            let byteString;
            let mimeString;

            if (dataURI.split(',').length > 1) {
                byteString = atob(dataURI.split(',')[1]);
                mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            } else {
                // No prefix: Decode and detect MIME type by signature
                byteString = atob(dataURI);
                mimeString = null; // Will detect below
            }

            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // Detect MIME type from Magic Numbers if not set
            if (!mimeString) {
                const header = Array.from(ia.slice(0, 4)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

                if (ia[0] === 0x25 && ia[1] === 0x50 && ia[2] === 0x44 && ia[3] === 0x46) {
                    mimeString = 'application/pdf'; // %PDF
                } else if (ia[0] === 0x89 && ia[1] === 0x50 && ia[2] === 0x4E && ia[3] === 0x47) {
                    mimeString = 'image/png'; // .PNG
                } else if (ia[0] === 0xFF && ia[1] === 0xD8 && ia[2] === 0xFF) {
                    mimeString = 'image/jpeg'; // JPG
                } else {
                    mimeString = 'application/octet-stream'; // Fallback
                    console.warn('Unknown file signature:', header);
                    alert(`Aviso: Tipo de archivo desconocido.\nEncabezado (Hex): ${header}\nSe intentará descargar como archivo genérico.`);
                }
                console.log('Detected MIME type:', mimeString, 'Header:', header);
            }

            console.log('Blob created:', mimeString, 'Size:', ab.byteLength);
            return new Blob([ab], { type: mimeString });
        } catch (e) {
            console.error('Error converting Data URI to Blob:', e);
            alert('Error crítico al procesar el archivo: ' + e.message);
            return null;
        }
    }

    dataURItoBlobRobust(dataURI) {
        try {
            if (!dataURI || dataURI.length < 50) {
                console.error('DataURI too short:', dataURI);
                alert('Error: El archivo parece estar vacío o dañado.');
                return null;
            }

            let byteString;
            let mimeStringFromPrefix = null;

            if (dataURI.split(',').length > 1) {
                byteString = atob(dataURI.split(',')[1]);
                mimeStringFromPrefix = dataURI.split(',')[0].split(':')[1].split(';')[0];
            } else {
                byteString = atob(dataURI);
            }

            let ab = new ArrayBuffer(byteString.length);
            let ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // --- SMART DETECTION & REPAIR ---
            let finalMime = null;
            let startIndex = 0;

            // 1. Check for PDF signature (%PDF) anywhere in the first 1024 bytes
            for (let i = 0; i < Math.min(1024, ia.length - 4); i++) {
                if (ia[i] === 0x25 && ia[i + 1] === 0x50 && ia[i + 2] === 0x44 && ia[i + 3] === 0x46) {
                    finalMime = 'application/pdf';
                    startIndex = i;
                    console.log(`PDF Signature found at index ${i}. Trimming previous bytes.`);
                    break;
                }
            }

            // 2. If not PDF, check for Images (start only)
            if (!finalMime) {
                if (ia[0] === 0x89 && ia[1] === 0x50 && ia[2] === 0x4E && ia[3] === 0x47) {
                    finalMime = 'image/png';
                } else if (ia[0] === 0xFF && ia[1] === 0xD8 && ia[2] === 0xFF) {
                    finalMime = 'image/jpeg';
                }
            }

            // 3. Trim ArrayBuffer if needed
            if (startIndex > 0) {
                ab = ab.slice(startIndex);
                ia = new Uint8Array(ab);
            }

            // 4. Fallback
            if (!finalMime) {
                if (mimeStringFromPrefix) {
                    finalMime = mimeStringFromPrefix;
                } else {
                    finalMime = 'application/octet-stream';
                    const header = Array.from(ia.slice(0, 4)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
                    console.warn('Unknown signature:', header);
                    alert(`Aviso: Archivo sin firma reconocida.\nHex: ${header}\nSe intentará abrir como genérico.`);
                }
            }

            return new Blob([ab], { type: finalMime });
        } catch (e) {
            console.error('Error converting Data URI to Blob:', e);
            if (e.message.includes('not correctly encoded')) {
                alert('Error: El archivo está corrupto (posiblemente truncado). Intenta subirlo nuevamente.');
            } else {
                alert('Error al procesar archivo: ' + e.message);
            }
            return null;
        }
    }

    attachDetailEvents(id) {
        // View Document Handler
        document.querySelectorAll('.btn-view-doc').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();

                const docId = btn.dataset.id;
                const originalHtml = btn.innerHTML;

                btn.innerHTML = '<span class="material-icons-round spin" style="font-size: 1.2rem;">refresh</span>';
                btn.disabled = true;

                try {
                    const dataUri = await this.store.downloadDocument(docId);
                    console.log('DEBUG DataURI:', dataUri ? dataUri.substring(0, 50) : 'null');

                    if (dataUri) {
                        const blob = this.dataURItoBlobRobust(dataUri);
                        if (!blob) throw new Error('Invalid document data');

                        const blobUrl = URL.createObjectURL(blob);
                        const win = window.open(blobUrl, '_blank');
                        if (!win) {
                            alert('Por favor permite las ventanas emergentes para ver el documento.');
                        }
                    }
                } catch (err) {
                    console.error(err);
                    alert('No se pudo abrir el documento. Es posible que el archivo esté dañado o incompleto.');
                } finally {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }
            });
        });

        // Download Document Handler
        document.querySelectorAll('.btn-download-doc').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();

                const docId = btn.dataset.id;
                const docName = btn.dataset.name;
                const originalHtml = btn.innerHTML;

                btn.innerHTML = '<span class="material-icons-round spin" style="font-size: 1.2rem;">refresh</span>';
                btn.disabled = true;

                try {
                    const dataUri = await this.store.downloadDocument(docId);
                    if (dataUri) {
                        const blob = this.dataURItoBlobRobust(dataUri);
                        if (!blob) throw new Error('Invalid document data');

                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = docName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    }
                } catch (err) {
                    console.error(err);
                    alert('No se pudo descargar el documento.');
                } finally {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }
            });
        });


        // View Cost Document Handler
        document.querySelectorAll('.btn-view-cost').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dataUri = btn.dataset.url;
                if (!dataUri) return;

                const blob = this.dataURItoBlobRobust(dataUri);
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    const win = window.open(blobUrl, '_blank');
                    if (!win) alert('Por favor permite las ventanas emergentes.');
                } else {
                    alert('Error al abrir el documento.');
                }
            });
        });

        // Download Cost Document Handler
        document.querySelectorAll('.btn-download-cost').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dataUri = btn.dataset.url;
                const name = btn.dataset.name;
                if (!dataUri) return;

                const blob = this.dataURItoBlobRobust(dataUri);
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                } else {
                    alert('Error al descargar el documento.');
                }
            });
        });

        // Edit Import
        const btnEdit = document.querySelector('.btn-edit-import');
        if (btnEdit) {
            btnEdit.addEventListener('click', () => {
                const file = this.store.getById('importFiles', id);
                if (file) {
                    this.openEditModal(file);
                }
            });
        }

        const btnSaveDetails = document.getElementById('btn-save-details');
        if (btnSaveDetails) {
            btnSaveDetails.addEventListener('click', () => {
                const eta = document.getElementById('input-eta').value;
                const ata = document.getElementById('input-ata').value;
                const ataDBS = document.getElementById('input-ata-dbs').value;
                const pedimento = document.getElementById('input-pedimento').value;
                const customsBroker = document.getElementById('input-broker').value;
                const regulatoryStatus = document.getElementById('input-regulatory').value;
                const mot = document.getElementById('input-mot').value;

                this.store.update('importFiles', id, {
                    eta: eta ? new Date(eta).toISOString() : null,
                    ata: ata ? new Date(ata).toISOString() : null,
                    ataDBS: ataDBS ? new Date(ataDBS).toISOString() : null,
                    pedimento,
                    customsBroker,
                    regulatoryStatus,
                    mot
                });
                alert('Detalles del expediente actualizados');
            });
        }

        // Update Status
        document.querySelectorAll('.btn-status-update').forEach(btn => {
            btn.addEventListener('click', () => {
                const newStatus = btn.dataset.status;
                this.store.update('importFiles', id, { status: newStatus });
                // Refresh view
                const container = document.getElementById('view-container');
                container.innerHTML = this.renderDetail(id);
                this.attachDetailEvents(id);
            });
        });

        // Add Document
        const btnAddDoc = document.getElementById('btn-add-doc');
        const inputDocFile = document.getElementById('input-doc-file');

        if (btnAddDoc && inputDocFile) {
            btnAddDoc.addEventListener('click', () => {
                inputDocFile.click();
            });

            inputDocFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const fileObj = e.target.files[0];

                    if (fileObj.size > 5 * 1024 * 1024) { // 5MB Warning
                        alert('Advertencia: El archivo es grande (> 5MB). Podría fallar al guardar.');
                    }

                    const type = prompt('Tipo de documento (Invoice, PL, BL, CoA, MSDS, Pedimento):', 'Invoice');

                    if (type) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            const file = this.store.getById('importFiles', id);
                            const newDoc = {
                                id: crypto.randomUUID(),
                                type: type,
                                url: evt.target.result,
                                name: fileObj.name,
                                date: new Date().toISOString(),
                                isOriginalReceived: false
                            };

                            this.store.addDocument('importFiles', id, newDoc).then(() => {
                                // Refresh
                                const container = document.getElementById('view-container');
                                container.innerHTML = this.renderDetail(id);
                                this.attachDetailEvents(id);
                            });
                        };
                        reader.readAsDataURL(fileObj);
                    } else {
                        inputDocFile.value = '';
                    }
                }
            });
        }

        // Analyze PDF
        const btnAnalyzePdf = document.getElementById('btn-analyze-pdf');
        const fileInputPdf = document.getElementById('file-upload-pdf');

        if (btnAnalyzePdf && fileInputPdf) {
            btnAnalyzePdf.addEventListener('click', () => {
                fileInputPdf.click();
            });

            fileInputPdf.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handlePdfAnalysis(e.target.files[0], id);
                    // Reset input
                    e.target.value = '';
                }
            });
        }

        // Delete Document
        document.querySelectorAll('.btn-delete-doc').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de eliminar este documento?')) {
                    const idx = Number(btn.dataset.idx);
                    const file = this.store.getById('importFiles', id);
                    if (file && file.documents) {
                        const docToDelete = file.documents[idx];
                        if (docToDelete) {
                            this.store.deleteDocument('importFiles', id, docToDelete.id).then(() => {
                                // Refresh
                                const container = document.getElementById('view-container');
                                container.innerHTML = this.renderDetail(id);
                                this.attachDetailEvents(id);
                            });
                        }
                    }
                }
            });
        });

        // Add Cost
        const btnAddCost = document.getElementById('btn-add-cost');
        if (btnAddCost) {
            btnAddCost.addEventListener('click', () => {
                this.openAddCostModal(id);
            });
        }

        // Delete Cost
        document.querySelectorAll('.btn-delete-cost').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Prevent bubbling if inside a container with other clicks, though not strictly needed here
                e.stopPropagation();
                if (confirm('¿Eliminar este costo?')) {
                    const costId = btn.dataset.id;
                    this.store.deleteCost('importFiles', id, costId).then(() => {
                        // Refresh
                        const container = document.getElementById('view-container');
                        container.innerHTML = this.renderDetail(id);
                        this.attachDetailEvents(id);
                    });
                }

            });
        });
    }

    // --- PDF ANALYSIS ---
    async handlePdfAnalysis(file, id) {
        if (file.type !== 'application/pdf') {
            alert('Solo se pueden analizar archivos PDF.');
            return;
        }

        const btnAnalyze = document.getElementById('btn-analyze-pdf');
        const originalText = btnAnalyze.innerHTML;
        btnAnalyze.innerHTML = '<span class="material-icons-round spin">refresh</span> Analizando...';
        btnAnalyze.disabled = true;

        try {
            const { PdfParseService } = await import('../services/pdf-service.js');
            const service = new PdfParseService();

            const text = await service.extractText(file);
            const costs = service.parseCosts(text);

            if (costs.length === 0) {
                alert('No se detectaron gastos reconocibles en el documento.');
            } else {
                this.showCostReviewModal(id, costs);
            }

        } catch (error) {
            console.error('Error parsing PDF:', error);
            alert(`Error al analizar el PDF: ${error.message}`);
        } finally {
            btnAnalyze.innerHTML = originalText;
            btnAnalyze.disabled = false;
        }

    }

    showCostReviewModal(id, detectedCosts) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1rem;">Gastos Detectados</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Confirma los gastos que deseas agregar al expediente.</p>

                    <form id="form-review-costs">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${detectedCosts.map((cost, idx) => `
                                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                                    <input type="checkbox" name="cost-idx" value="${idx}" checked style="width: 1.25rem; height: 1.25rem;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">${cost.label}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-family: monospace;">"${cost.originalMatch}"</div>
                                    </div>
                                    <div style="font-weight: 700; color: var(--primary-color);">
                                        $${cost.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel-review" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Seleccionados</button>
                        </div>
                    </form>
                </div>
            </div>
            `;

        document.getElementById('btn-cancel-review').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.getElementById('form-review-costs').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const selectedIndices = formData.getAll('cost-idx').map(Number);

            if (selectedIndices.length > 0) {
                import('../models.js').then(({ CostRecord }) => {
                    const file = this.store.getById('importFiles', id);
                    const costs = file.costs || [];

                    selectedIndices.forEach(idx => {
                        const costData = detectedCosts[idx];
                        costs.push(new CostRecord({
                            type: costData.type,
                            amount: costData.amount,
                            currency: costData.currency,
                            exchangeRate: 1.0, // Default
                            description: `Detectado de PDF: ${costData.originalMatch} `
                        }));
                    });

                    this.store.update('importFiles', id, { costs });
                    modalContainer.innerHTML = '';

                    // Refresh if in detail view
                    const container = document.getElementById('view-container');
                    container.innerHTML = this.renderDetail(id);
                    this.attachDetailEvents(id);

                    alert(`${selectedIndices.length} gastos agregados correctamente.`);
                });
            } else {
                modalContainer.innerHTML = '';
            }
        });
    }

    attachEvents() {
        // New Import
        const btnNew = document.getElementById('btn-new-import');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openCreateModal());
        }

        // Search Filter
        const searchInput = document.getElementById('search-expedientes');
        if (searchInput) {
            let debounceTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                const term = e.target.value.toLowerCase();

                debounceTimeout = setTimeout(() => {
                    const rows = document.querySelectorAll('tbody tr');

                    // Optimization: Only search after 4 characters
                    if (term.length > 0 && term.length < 4) {
                        return;
                    }

                    if (term.length < 4) {
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
                }, 300); // Wait 300ms after last keystroke
            });
        }

        // Excel Import Events
        const btnImport = document.getElementById('btn-import-excel');
        const fileInput = document.getElementById('file-upload-excel');

        if (btnImport && fileInput) {
            console.log('Attaching Excel Import Events');
            btnImport.addEventListener('click', () => {
                console.log('Import Button Clicked');
                fileInput.click();
            });
            fileInput.addEventListener('change', (e) => {
                console.log('File Input Changed', e.target.files);
                this.handleExcelUpload(e);
            });
        } else {
            console.error('Import Button or File Input not found');
        }

        // Edit Import
        document.querySelectorAll('.btn-edit-import').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const file = this.store.getById('importFiles', id);
                if (file) {
                    this.openEditModal(file);
                }
            });
        });

        // Delete Import
        document.querySelectorAll('.btn-delete-import').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de eliminar este expediente? Esta acción no se puede deshacer.')) {
                    const id = btn.dataset.id;
                    this.store.delete('importFiles', id);
                    // Refresh view
                    const container = document.getElementById('view-container');
                    container.innerHTML = this.render();
                    this.attachEvents();
                }
            });
        });
    }
}
