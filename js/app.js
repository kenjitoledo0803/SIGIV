/**
 * IMS Application Entry Point
 */

import { Store } from './store.js';
import { AuthService } from './auth.js';
import { LoginView } from './views/login.js';
import { ShipmentsView } from './views/shipments.js?v=4';
import { ExpedientesView } from './views/expedientes.js?v=2';
import { ConsolidationsView } from './views/consolidations.js?v=2';
import { SavingsView } from './views/savings.js';

class App {
    constructor() {
        this.store = new Store();
        this.auth = new AuthService();
        this.currentView = 'dashboard';
        this.init();
    }

    async init() {
        try {
            console.log('IMS App Initializing...');

            // 1. Check Auth
            const isAuth = await this.auth.checkAuth();

            // 2. Initialize Store (Load data) if auth
            if (isAuth) {
                await this.store.init();
                this.updateUserUI();
            }

            // 3. Setup Navigation
            this.setupNavigation();

            // 4. Load Initial View
            this.handleRouting();

        } catch (error) {
            console.error('App Init Error:', error);
            const container = document.getElementById('view-container');
            if (container) {
                container.innerHTML = `
                    <div style="color: red; padding: 2rem; text-align: center;">
                        <h3>Error al iniciar la aplicación</h3>
                        <p>${error.message}</p>
                        <pre style="text-align: left; background: #eee; padding: 1rem; overflow: auto;">${error.stack}</pre>
                    </div>
                `;
            }
        }
    }

    updateUserUI() {
        if (this.auth.currentUser) {
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                // Get Initials
                const username = this.auth.currentUser.username || 'Usuario';
                const initials = (username || 'U').substring(0, 2).toUpperCase();

                userProfile.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 0.5rem;">
                        <span class="user-name" style="font-weight: 600; font-size: 0.875rem; color: var(--text-main);">${username}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize;">${this.auth.currentUser.role.toLowerCase()}</span>
                    </div>
                    <div class="avatar" style="cursor: pointer;" title="Cerrar Sesión">${initials}</div>
                    <button id="btn-header-logout" class="btn" style="padding: 0.5rem; color: var(--text-secondary); margin-left: 0.5rem;" title="Cerrar Sesión">
                        <span class="material-icons-round">logout</span>
                    </button>
                `;

                // Logout Event
                const btnLogout = document.getElementById('btn-header-logout');
                if (btnLogout) {
                    btnLogout.addEventListener('click', async () => {
                        if (confirm('¿Cerrar sesión?')) {
                            await this.auth.logout();
                            window.location.reload();
                        }
                    });
                }
            }
        }
    }

    setupNavigation() {
        // Navigation Links
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.id === 'btn-reset-system') return; // Skip reset button
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.navigateTo(view);
            });
        });

        // Reset System Button
        const btnReset = document.getElementById('btn-reset-system');
        if (btnReset) {
            btnReset.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('⚠️ ¡PELIGRO!\n\n¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?\n\nEsta acción no se puede deshacer.')) {
                    if (confirm('Confirma por segunda vez: ¿Borrar todo el sistema?')) {
                        this.store.reset();
                        alert('Sistema reiniciado. La página se recargará.');
                        window.location.reload();
                    }
                }
            });
        }

        // Export Data
        const btnExport = document.getElementById('btn-export-data');
        if (btnExport) {
            btnExport.addEventListener('click', (e) => {
                e.preventDefault();
                const data = this.store.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ims_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Import Data
        const btnImport = document.getElementById('btn-import-data');
        if (btnImport) {
            btnImport.addEventListener('click', (e) => {
                e.preventDefault();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (event) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const content = e.target.result;
                        if (confirm('⚠️ ¿Estás seguro de importar estos datos?\n\nEsto SOBREESCRIBIRÁ la base de datos actual.')) {
                            const result = await this.store.importData(content);
                            if (result.success) {
                                alert('Datos importados correctamente. La página se recargará.');
                                window.location.reload();
                            } else {
                                alert('Error al importar: ' + result.message);
                            }
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        }

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRouting();
        });

        // Listen for View Updates (e.g. after import)
        window.addEventListener('view-update', () => {
            this.renderView(this.currentView);
        });
    }

    navigateTo(view) {
        // Update URL without reload
        window.history.pushState({ view }, '', `#${view}`);
        this.handleRouting();
    }

    handleRouting() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const [view, ...params] = hash.split('/');

        // Route Guard
        if (!this.auth.isAuthenticated() && view !== 'login') {
            this.currentView = 'login';
            window.history.replaceState(null, '', '#login');
        } else {
            this.currentView = view;
        }

        // Update Active Nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === this.currentView);
        });

        // Toggle Layout for Login vs App
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const topBar = document.querySelector('.top-bar');
        const viewContainer = document.getElementById('view-container');

        if (this.currentView === 'login') {
            if (sidebar) sidebar.style.display = 'none';
            if (topBar) topBar.style.display = 'none';
            if (mainContent) mainContent.style.marginLeft = '0';
            if (viewContainer) viewContainer.style.padding = '0';
        } else {
            if (sidebar) sidebar.style.display = '';
            if (topBar) topBar.style.display = '';
            if (mainContent) mainContent.style.marginLeft = '';
            if (viewContainer) viewContainer.style.padding = '';
        }

        // Update Page Title
        const titleMap = {
            'login': 'Iniciar Sesión',
            'dashboard': 'Dashboard General',
            'shipments': 'Gestión de Embarques',
            'consolidations': 'Consolidaciones',
            'expedientes': 'Gestión de Expedientes (POs)',
            'proveedores': 'Directorio de Proveedores',
            'materiales': 'Catálogo de Materiales',
            'finanzas': 'Control Financiero',
            'finanzas': 'Control Financiero',
            'calendar': 'Calendario de Entregas',
            'finanzas': 'Control Financiero',
            'calendar': 'Calendario de Entregas',
            'dpi': 'Conversión VUCEM (300 DPI)',
            'savings': 'Proyectos de Ahorro',
            'siicex': 'Consulta SIICEX (Tarifa)'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titleMap[this.currentView] || 'IMS';
        }

        // Render View
        this.renderView(this.currentView, params);
    }

    renderView(view, params) {
        const container = document.getElementById('view-container');
        if (!container) return;
        container.innerHTML = ''; // Clear current view

        switch (view) {
            case 'login':
                const loginView = new LoginView(this.auth);
                container.innerHTML = loginView.render();
                loginView.attachEvents();
                break;
            case 'dashboard':
                container.innerHTML = this.getDashboardTemplate();
                break;
            case 'calendar':
                import('./views/calendar.js').then(module => {
                    const view = new module.CalendarView(this.store);
                    container.innerHTML = view.render();
                    view.attachEvents();
                });
                break;
            case 'expedientes':
                import('./views/expedientes.js?v=6').then(module => {
                    const view = new module.ExpedientesView(this.store);
                    if (params && params.length > 0) {
                        container.innerHTML = view.renderDetail(params[0]);
                        view.attachDetailEvents(params[0]);
                    } else {
                        container.innerHTML = view.render();
                        view.attachEvents();
                    }
                }).catch(error => {
                    console.error('Error loading ExpedientesView:', error);
                    container.innerHTML = `<div class="card" style="color: red;">
                        <h3>Error loading view</h3>
                        <pre>${error.message}\n${error.stack}</pre>
                    </div>`;
                });
                break;
            case 'shipments':
                import('./views/shipments.js?v=5').then(module => {
                    const view = new module.ShipmentsView(this.store);
                    if (params && params.length > 0) {
                        container.innerHTML = view.renderDetail(params[0]);
                        view.attachDetailEvents(params[0]);
                    } else {
                        container.innerHTML = view.render();
                        view.attachEvents();
                    }
                }).catch(error => {
                    console.error('Error loading ShipmentsView:', error);
                    container.innerHTML = `<div class="card" style="color: red;">
                        <h3>Error loading view</h3>
                        <pre>${error.message}\n${error.stack}</pre>
                    </div>`;
                });
                break;
            case 'consolidations':
                import('./views/consolidations.js?v=3').then(module => {
                    const view = new module.ConsolidationsView(this.store);
                    if (params && params.length > 0) {
                        container.innerHTML = view.renderDetail(params[0]);
                        view.attachDetailEvents(params[0]);
                    } else {
                        container.innerHTML = view.render(params);
                        view.attachEvents();
                    }
                }).catch(error => {
                    console.error('Error loading ConsolidationsView:', error);
                    container.innerHTML = `<div class="card" style="color: red;">
                        <h3>Error loading view</h3>
                        <pre>${error.message}\n${error.stack}</pre>
                    </div>`;
                });
                break;
            case 'proveedores':
                import('./views/suppliers.js?v=6').then(module => {
                    const view = new module.SuppliersView(this.store);
                    container.innerHTML = view.render();
                    view.attachEvents();
                });
                break;
            case 'materiales':
                import('./views/materials.js?v=4').then(module => {
                    const view = new module.MaterialsView(this.store);
                    container.innerHTML = view.render();
                    view.attachEvents();
                });
                break;
            case 'finanzas':
                import('./views/finanzas.js').then(module => {
                    const view = new module.FinanzasView(this.store);
                    container.innerHTML = view.render();
                    view.attachEvents();
                });
                break;
            case 'dpi':
                import('./views/dpi_conversion.js?v=2.1').then(module => {
                    const view = new module.DpiConversionView();
                    container.innerHTML = view.render();
                    view.attachEvents();
                });
                break;
            case 'savings':
                const savingsView = new SavingsView(this.store);
                container.innerHTML = savingsView.render();
                savingsView.attachEvents();
                break;
            case 'siicex':
                import('./views/siicex.js?v=5.0').then(module => {
                    const view = new module.SiicexView();
                    container.innerHTML = view.render();
                    view.attachEvents();
                }).catch(err => {
                    console.error('Error loading SiicexView:', err);
                    container.innerHTML = `<div class="card" style="color: red;"><h3>Error loading view</h3><pre>${err.message}</pre></div>`;
                });
                break;
            default:
                container.innerHTML = '<div class="card"><h3>404 - Vista no encontrada</h3></div>';
        }
    }

    getDashboardTemplate() {
        // 1. Fetch Data
        const files = this.store.getAll('importFiles') || [];
        const shipments = this.store.getAll('shipments') || [];

        // 2. Status Grouping Logic
        const statusGroups = {
            planning: ['DOCUMENTACION', 'INSTRUCCION'],
            transit: ['REFERENCIA', 'ETA', 'RECOLECCION'],
            customs: ['PREVIO_PEDIMENTO', 'DESPACHO', 'INSPECCION'],
            delivery: ['ARRIBO', 'ARRIBO_DBS'],
            exceptions: ['RETORNO', 'ABANDONO', 'RECHAZO', 'NO_LLEGO', 'DETENIDA']
        };

        const metrics = {
            planning: files.filter(f => statusGroups.planning.includes(f.status)).length,
            transit: files.filter(f => statusGroups.transit.includes(f.status)).length,
            customs: files.filter(f => statusGroups.customs.includes(f.status)).length,
            delivery: files.filter(f => statusGroups.delivery.includes(f.status)).length,
            exceptions: files.filter(f => statusGroups.exceptions.includes(f.status)).length
        };

        // 3. Financial Calculations (Current Month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let monthlyPOValue = 0; // Value of goods
        let monthlyLogisticsCost = 0; // Extra costs (freight, duties, etc.)

        files.forEach(f => {
            const d = new Date(f.createdAt);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                // PO Value (Approximate to MXN for aggregation)
                const poVal = Number(f.netOrderValue) || 0;
                const rate = f.currency === 'MXN' ? 1 : 20; // Estimated rate for dashboard
                monthlyPOValue += poVal * rate;

                // Logistics Costs
                const extra = (f.costs || []).reduce((acc, c) => acc + (c.amount * c.exchangeRate), 0);
                monthlyLogisticsCost += extra;
            }
        });

        const totalSpend = monthlyPOValue + monthlyLogisticsCost;

        // 4. Recent Activity
        const allActivity = [
            ...files.map(f => ({
                type: 'Expediente',
                ref: f.referenceNumber,
                status: f.status,
                date: f.createdAt,
                id: f.id,
                link: '#expedientes/',
                value: f.netOrderValue,
                currency: f.currency
            })),
            ...shipments.map(s => ({
                type: 'Embarque',
                ref: s.reference,
                status: s.status,
                date: s.createdAt,
                id: s.id,
                link: '#shipments/',
                value: 0,
                currency: ''
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- KPI Cards -->
                <div class="card" style="border-left: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <h4 style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;">Planeación</h4>
                            <div style="font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem;">${metrics.planning}</div>
                        </div>
                        <span class="material-icons-round" style="color: var(--primary-color); opacity: 0.2; font-size: 2rem;">assignment</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Documentación e Instrucciones</div>
                </div>

                <div class="card" style="border-left: 4px solid var(--status-transit);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <h4 style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;">En Tránsito</h4>
                            <div style="font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem;">${metrics.transit}</div>
                        </div>
                        <span class="material-icons-round" style="color: var(--status-transit); opacity: 0.2; font-size: 2rem;">local_shipping</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">En camino a frontera/puerto</div>
                </div>

                <div class="card" style="border-left: 4px solid var(--status-customs);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <h4 style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;">Aduana</h4>
                            <div style="font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem;">${metrics.customs}</div>
                        </div>
                        <span class="material-icons-round" style="color: var(--status-customs); opacity: 0.2; font-size: 2rem;">gavel</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Despacho y Previos</div>
                </div>

                <div class="card" style="border-left: 4px solid #ef4444;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <h4 style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;">Atención Requerida</h4>
                            <div style="font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; color: #ef4444;">${metrics.exceptions}</div>
                        </div>
                        <span class="material-icons-round" style="color: #ef4444; opacity: 0.2; font-size: 2rem;">warning</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Retornos, Rechazos, Detenidos</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                <!-- Recent Activity Table -->
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; font-size: 1.125rem;">Actividad Reciente</h3>
                        <a href="#expedientes" style="font-size: 0.875rem; color: var(--primary-color); text-decoration: none;">Ver todo</a>
                    </div>

                    ${allActivity.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Referencia</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Tipo</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Estado</th>
                                    <th style="padding: 0.75rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; text-align: right;">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allActivity.map(item => `
                                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 1rem 0.75rem; font-weight: 500;">
                                            <a href="${item.link}${item.id}" style="text-decoration: none; color: var(--text-main); display: flex; flex-direction: column;">
                                                <span>${item.ref}</span>
                                                ${item.value ? `<span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400;">${item.currency} ${Number(item.value).toLocaleString()}</span>` : ''}
                                            </a>
                                        </td>
                                        <td style="padding: 1rem 0.75rem;">
                                            <span style="font-size: 0.75rem; font-weight: 600; background: var(--bg-body); padding: 4px 8px; border-radius: 4px; color: var(--text-secondary);">${item.type}</span>
                                        </td>
                                        <td style="padding: 1rem 0.75rem;">
                                            <span style="font-size: 0.875rem; color: var(--text-secondary);">${item.status}</span>
                                        </td>
                                        <td style="padding: 1rem 0.75rem; color: var(--text-secondary); text-align: right; font-size: 0.875rem;">
                                            ${new Date(item.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No hay actividad reciente.</div>'}
                </div>

                <!-- Financial Summary -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="card" style="background: linear-gradient(135deg, var(--primary-color), #2563eb); color: white;">
                        <h4 style="margin-bottom: 0.5rem; font-size: 0.875rem; opacity: 0.9;">Gasto Total Estimado (Mes)</h4>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 1rem;">$${totalSpend.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span style="font-size: 1rem; font-weight: 400;">MXN</span></div>

                        <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: var(--radius-sm);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="font-size: 0.875rem; opacity: 0.9;">Valor Mercancía</span>
                                <span style="font-weight: 600;">$${monthlyPOValue.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 0.875rem; opacity: 0.9;">Logística e Impuestos</span>
                                <span style="font-weight: 600;">$${monthlyLogisticsCost.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h4 style="margin-bottom: 1rem; font-size: 0.875rem; color: var(--text-secondary);">Entregas Completadas (Mes)</h4>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="font-size: 2.5rem; font-weight: 700; color: var(--status-released);">${metrics.delivery}</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                                Expedientes finalizados y entregados en almacén este mes.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize App
window.app = new App();
