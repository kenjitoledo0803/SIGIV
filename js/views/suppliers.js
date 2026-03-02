import { Supplier } from '../models.js';

export class SuppliersView {
    constructor(store) {
        this.store = store;
    }

    render() {
        const suppliers = this.store.getAll('suppliers');

        return `
            <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="margin-bottom: 0.5rem;">Directorio de Proveedores</h2>
                    <p style="color: var(--text-secondary);">Gestiona tus socios comerciales internacionales.</p>
                </div>
                <button id="btn-add-supplier" class="btn btn-primary">
                    <span class="material-icons-round">add</span>
                    Nuevo Proveedor
                </button>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="position: relative;">
                    <span class="material-icons-round" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">search</span>
                    <input type="text" id="search-suppliers" placeholder="Buscar por Nombre o Tax ID..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);">
                </div>
            </div>

            <div class="card">
                ${suppliers.length === 0 ? this.getEmptyState() : this.getTable(suppliers)}
            </div>

            <!-- Modal Container (Hidden by default) -->
            <div id="modal-container"></div>
        `;
    }

    getEmptyState() {
        return `
            <div style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;">business_off</span>
                <h3 style="margin-bottom: 0.5rem;">No hay proveedores registrados</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Comienza agregando tu primer proveedor internacional.</p>
            </div>
        `;
    }

    getTable(suppliers) {
        return `
            <table id="suppliers-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Nombre</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Tax ID</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Términos de Pago</th>
                        <th style="padding: 1rem; color: var(--text-secondary); font-weight: 500;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${suppliers.map(s => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 1rem; font-weight: 500;">${s.name}</td>
                            <td style="padding: 1rem;">${s.taxId || '-'}</td>
                            <td style="padding: 1rem;">${s.paymentTerms || '-'}</td>
                            <td style="padding: 1rem;">
                                <button class="btn-icon btn-edit-supplier" data-id="${s.id}" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); margin-right: 0.5rem;">
                                    <span class="material-icons-round">edit</span>
                                </button>
                                <button class="btn-icon btn-delete-supplier" data-id="${s.id}" style="color: #ef4444; border: none; background: none; cursor: pointer;">
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
        const btnAdd = document.getElementById('btn-add-supplier');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.openModal());
        }

        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.openModal());
        }

        // Search Filter
        const searchInput = document.getElementById('search-suppliers');
        if (searchInput) {
            let debounceTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                const term = e.target.value.toLowerCase();

                debounceTimeout = setTimeout(() => {
                    const rows = document.querySelectorAll('#suppliers-table tbody tr');

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
        const container = document.getElementById('suppliers-table');
        if (container) {
            container.addEventListener('click', (e) => {
                // Edit
                const btnEdit = e.target.closest('.btn-edit-supplier');
                if (btnEdit) {
                    const id = btnEdit.dataset.id;
                    const supplier = this.store.getById('suppliers', id);
                    if (supplier) {
                        this.openEditModal(supplier);
                    }
                }

                // Delete
                const btnDelete = e.target.closest('.btn-delete-supplier');
                if (btnDelete) {
                    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
                        const id = btnDelete.dataset.id;
                        this.store.delete('suppliers', id);
                        window.dispatchEvent(new Event('view-update'));
                    }
                }
            });
        }
    }

    openModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Nuevo Proveedor</h3>
                    <form id="form-supplier">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre de la Empresa</label>
                            <input type="text" name="name" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tax ID / VAT Number</label>
                            <input type="text" name="taxId" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Términos de Pago</label>
                            <select name="paymentTerms" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <option value="Net 30">Net 30</option>
                                <option value="Net 60">Net 60</option>
                                <option value="T/T 100% Advance">T/T 100% Advance</option>
                                <option value="L/C">Letter of Credit</option>
                            </select>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="button" id="btn-cancel" class="btn" style="background: transparent; border: 1px solid var(--border-color);">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Proveedor</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-cancel').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        document.getElementById('form-supplier').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newSupplier = new Supplier({
                name: formData.get('name'),
                taxId: formData.get('taxId'),
                paymentTerms: formData.get('paymentTerms'),
                bankDetails: {} // Placeholder
            });

            this.store.add('suppliers', newSupplier);
            modalContainer.innerHTML = '';

            // Re-render
            // Ideally we should use a proper event bus or callback, but for now we'll reload the view via the main app logic or just re-render here if we had reference to the container.
            // Since we are inside the view, we can't easily re-render the whole page without the App controller.
            // A simple hack for this vanilla app: trigger a custom event or just reload page hash.
            window.dispatchEvent(new Event('view-update'));
        });
    }
    openEditModal(supplier) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">Editar Proveedor</h3>
                    <form id="form-edit-supplier">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre de la Empresa</label>
                            <input type="text" name="name" value="${supplier.name}" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tax ID / VAT Number</label>
                            <input type="text" name="taxId" value="${supplier.taxId || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Términos de Pago</label>
                            <select name="paymentTerms" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <option value="Net 30" ${supplier.paymentTerms === 'Net 30' ? 'selected' : ''}>Net 30</option>
                                <option value="Net 60" ${supplier.paymentTerms === 'Net 60' ? 'selected' : ''}>Net 60</option>
                                <option value="T/T 100% Advance" ${supplier.paymentTerms === 'T/T 100% Advance' ? 'selected' : ''}>T/T 100% Advance</option>
                                <option value="L/C" ${supplier.paymentTerms === 'L/C' ? 'selected' : ''}>Letter of Credit</option>
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

        document.getElementById('form-edit-supplier').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            this.store.update('suppliers', supplier.id, {
                name: formData.get('name'),
                taxId: formData.get('taxId'),
                paymentTerms: formData.get('paymentTerms')
            });

            modalContainer.innerHTML = '';
            window.dispatchEvent(new Event('view-update'));
        });
    }
}
