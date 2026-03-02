export class FinanzasView {
    constructor(store) {
        this.store = store;
    }

    render() {
        const files = this.store.getAll('importFiles');
        let totalSpend = 0;
        let spendBySupplier = {};

        files.forEach(f => {
            if (f.costs) {
                f.costs.forEach(c => {
                    const amountMXN = c.amount * c.exchangeRate;
                    totalSpend += amountMXN;

                    if (!spendBySupplier[f.supplierId]) spendBySupplier[f.supplierId] = 0;
                    spendBySupplier[f.supplierId] += amountMXN;
                });
            }
        });

        const suppliers = this.store.getAll('suppliers');

        return `
            <div class="header-actions" style="margin-bottom: 2rem;">
                <h2 style="margin-bottom: 0.5rem;">Control Financiero</h2>
                <p style="color: var(--text-secondary);">Resumen de costos de importación y landed costs.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="card">
                    <h4 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Gasto Total Acumulado</h4>
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color);">
                        $${totalSpend.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span style="font-size: 1rem; color: var(--text-secondary);">MXN</span>
                    </div>
                </div>
                <div class="card">
                    <h4 style="color: var(--text-secondary); margin-bottom: 1rem;">Gasto por Proveedor</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${Object.keys(spendBySupplier).map(supplierId => {
            const supplier = suppliers.find(s => s.id === supplierId);
            const amount = spendBySupplier[supplierId];
            const percent = (amount / totalSpend) * 100;
            return `
                                <li style="margin-bottom: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                                        <span>${supplier ? supplier.name : 'Unknown'}</span>
                                        <span style="font-weight: 600;">$${amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div style="width: 100%; height: 6px; background: var(--bg-body); border-radius: 99px; overflow: hidden;">
                                        <div style="width: ${percent}%; height: 100%; background: var(--accent-color);"></div>
                                    </div>
                                </li>
                            `;
        }).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // No interactive events for this dashboard yet
    }
}
