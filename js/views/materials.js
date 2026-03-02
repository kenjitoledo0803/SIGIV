import { Material } from '../models.js';

export class MaterialsView {
    constructor(store) {
        this.store = store;
    }

    render() {
        const materials = this.store.getAll('materials');
        const suppliers = this.store.getAll('suppliers');

        return `
            <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="margin-bottom: 0.5rem;">Catálogo de Materiales</h2>
                    <p style="color: var(--text-secondary);">Base de datos de productos y fracciones arancelarias.</p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <input type="file" id="file-import-regulations" accept=".csv" style="display: none;">
                    <button id="btn-import-regulations" class="btn btn-secondary">
                        <span class="material-icons-round">upload_file</span>
                        Importar Regulaciones
                    </button>
                    <button id="btn-add-material" class="btn btn-primary">
                        <span class="material-icons-round">add</span>
                        Nuevo Material
                    </button>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="position: relative;">
                    <span class="material-icons-round" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">search</span>
                    <input type="text" id="search-materials" placeholder="Buscar por SKU, Descripción o HS Code..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <div class="card">
                ${materials.length === 0 ? this.getEmptyState() : this.getTable(materials, suppliers)}
            </div>

            <div id="modal-container"></div>
        `;
    }

    getEmptyState() {
        return `
            <div style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;">inventory_2</span>
                <h3 style="margin-bottom: 0.5rem;">No hay materiales registrados</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Registra los productos que importas regularmente.</p>
            </div>
        `;
    }

    getTable(materials, suppliers) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">SKU</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Descripción</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">CAS / Químico</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">HS Code / NICO</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Regulaciones</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Proveedor</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${materials.map(m => {
            const supplier = suppliers.find(s => s.id === m.supplierId);
            return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 1rem; font-weight: 500;">${m.sku}</td>
                            <td style="padding: 1rem;">
                                ${m.description}
                                ${m.isHazardous ? '<span style="display: inline-block; margin-left: 0.5rem; background: #fee2e2; color: #ef4444; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">HAZMAT</span>' : ''}
                            </td>
                            <td style="padding: 1rem;">${m.casNumber || '-'}</td>
                            <td style="padding: 1rem;">
                                <div style="font-family: monospace;">${m.hsCode}</div>
                                ${m.nico ? `<div style="font-family: monospace; color: var(--text-secondary); font-size: 0.8rem;">NICO: ${m.nico}</div>` : ''}
                            </td>
                            <td style="padding: 1rem;">
                                ${m.regulations ? `<span style="background: #fff7ed; color: #c2410c; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">${m.regulations}</span>` : '-'}
                            </td>
                            <td style="padding: 1rem;">${supplier ? supplier.name : '<span style="color: #ef4444;">Desconocido</span>'}</td>
                            <td style="padding: 1rem;">
                                <button class="btn-icon btn-edit-material" data-id="${m.id}" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); margin-right: 0.5rem;">
                                    <span class="material-icons-round">edit</span>
                                </button>
                                <button class="btn-icon btn-delete-material" data-id="${m.id}" style="color: #ef4444; border: none; background: none; cursor: pointer;">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        `;
    }

    attachEvents() {
        const btnAdd = document.getElementById('btn-add-material');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.openModal());
        }

        // Search Filter
        const searchInput = document.getElementById('search-materials');
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

        const btnImport = document.getElementById('btn-import-regulations');
        const fileInput = document.getElementById('file-import-regulations');

        if (btnImport && fileInput) {
            btnImport.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleRegulationsImport(file);
                }
            });
        }

        // Edit Material
        document.querySelectorAll('.btn-edit-material').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const material = this.store.getById('materials', id);
                if (material) {
                    this.openEditModal(material);
                }
            });
        });

        // Delete Material
        document.querySelectorAll('.btn-delete-material').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de eliminar este material?')) {
                    const id = btn.dataset.id;
                    this.store.delete('materials', id);
                    window.dispatchEvent(new Event('view-update'));
                }
            });
        });
    }

    async handleRegulationsImport(file) {
        const text = await file.text();
        const lines = text.split('\n');
        let updatedCount = 0;
        let createdCount = 0;

        // Skip header if present (assuming first line might be header)
        // Simple heuristic: check if first line contains "Material" or similar
        const startIndex = lines[0].toLowerCase().includes('material') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // CSV parsing (handling quotes is tricky, simple split for now as per user file)
            // Assuming standard CSV: Code, Description, Regulation...
            // Using a regex to handle quoted fields if possible, or simple split if simple CSV
            // The user file seems to have quoted fields: "CHEESE, CHEDDAR..."

            const parts = [];
            let current = '';
            let inQuotes = false;

            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current.trim());

            if (parts.length < 3) continue;

            const code = parts[0]; // Column A
            const regulation = parts[2]; // Column C

            if (!code || !regulation) continue;

            const materials = this.store.getAll('materials');
            const existingMaterial = materials.find(m => m.sku === code);

            if (existingMaterial) {
                console.log(`Updating material ${code} with regulations: ${regulation}`);
                this.store.update('materials', existingMaterial.id, { regulations: regulation });
                updatedCount++;
            } else {
                console.log(`Creating new material ${code} with regulations: ${regulation}`);
                const newMaterial = new Material({
                    sku: code,
                    description: parts[1] || 'Importado desde CSV',
                    regulations: regulation,
                    supplierId: null // Unknown supplier
                });
                this.store.add('materials', newMaterial);
                createdCount++;
            }
        }

        console.log(`Import complete. Updated: ${updatedCount}, Created: ${createdCount}`);
        alert(`Importación completada.\nActualizados: ${updatedCount}\nCreados: ${createdCount}\n\nRevisa la consola para más detalles.`);
        window.dispatchEvent(new Event('view-update'));
    }

    openModal() {
        const suppliers = this.store.getAll('suppliers');
        if (suppliers.length === 0) {
            alert('Primero debes registrar al menos un proveedor.');
            return;
        }

        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Nuevo Material</h3>
                    <form id="form-material">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">SKU / Código</label>
                            <input type="text" name="sku" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción</label>
                            <input type="text" name="description" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">HS Code (Fracción)</label>
                                <input type="text" name="hsCode" placeholder="0000.00.00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">NICO</label>
                                <input type="text" name="nico" placeholder="00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">CAS Number</label>
                                <input type="text" name="casNumber" placeholder="00-00-0" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Unidad (UOM)</label>
                                <select name="uom" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="KG">Kilogramo</option>
                                    <option value="L">Litro</option>
                                    <option value="TAMBOR">Tambor</option>
                                    <option value="IBC">IBC/Tote</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="isHazardous">
                                <span style="font-weight: 500; color: #ef4444;">Material Peligroso (HAZMAT)</span>
                            </label>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Proveedor</label>
                            <select name="supplierId" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Material</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.getElementById('form-material').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newMaterial = new Material({
                sku: formData.get('sku'),
                description: formData.get('description'),
                hsCode: formData.get('hsCode'),
                nico: formData.get('nico'),
                casNumber: formData.get('casNumber'),
                isHazardous: formData.get('isHazardous') === 'on',
                uom: formData.get('uom'),
                supplierId: formData.get('supplierId')
            });

            this.store.add('materials', newMaterial);
            modalContainer.innerHTML = '';
            window.dispatchEvent(new Event('view-update'));
        });
    }
    openEditModal(material) {
        const suppliers = this.store.getAll('suppliers');
        const modalContainer = document.getElementById('modal-container');

        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Editar Material</h3>
                    <form id="form-edit-material">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">SKU / Código</label>
                            <input type="text" name="sku" value="${material.sku}" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción</label>
                            <input type="text" name="description" value="${material.description}" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">HS Code (Fracción)</label>
                                <input type="text" name="hsCode" value="${material.hsCode || ''}" placeholder="0000.00.00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">NICO</label>
                                <input type="text" name="nico" value="${material.nico || ''}" placeholder="00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">CAS Number</label>
                                <input type="text" name="casNumber" value="${material.casNumber || ''}" placeholder="00-00-0" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Unidad (UOM)</label>
                                <select name="uom" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                    <option value="KG" ${material.uom === 'KG' ? 'selected' : ''}>Kilogramo</option>
                                    <option value="L" ${material.uom === 'L' ? 'selected' : ''}>Litro</option>
                                    <option value="TAMBOR" ${material.uom === 'TAMBOR' ? 'selected' : ''}>Tambor</option>
                                    <option value="IBC" ${material.uom === 'IBC' ? 'selected' : ''}>IBC/Tote</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="isHazardous" ${material.isHazardous ? 'checked' : ''}>
                                <span style="font-weight: 500; color: #ef4444;">Material Peligroso (HAZMAT)</span>
                            </label>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Regulaciones</label>
                            <input type="text" name="regulations" value="${material.regulations || ''}" placeholder="Ej. USDA, COFEPRIS..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Proveedor</label>
                            <select name="supplierId" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                ${suppliers.map(s => `<option value="${s.id}" ${s.id === material.supplierId ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel-edit" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel-edit').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.getElementById('form-edit-material').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            this.store.update('materials', material.id, {
                sku: formData.get('sku'),
                description: formData.get('description'),
                hsCode: formData.get('hsCode'),
                nico: formData.get('nico'),
                casNumber: formData.get('casNumber'),
                regulations: formData.get('regulations'),
                isHazardous: formData.get('isHazardous') === 'on',
                uom: formData.get('uom'),
                supplierId: formData.get('supplierId')
            });

            modalContainer.innerHTML = '';
            window.dispatchEvent(new Event('view-update'));
        });
    }
}
