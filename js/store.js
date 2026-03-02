/**
 * Store - LocalStorage Wrapper for Data Persistence
 */
export class Store {
    constructor() {
        this.dbName = 'ims_db_v1';
        this.apiUrl = './api/index.php';
        this.useApi = false; // Will be determined during init
        this.data = {
            suppliers: [],
            materials: [],
            importFiles: [],
            shipments: [],
            documents: [],
            financials: [],
            savingsProjects: [],
            savingsEntries: []
        };
    }

    async init() {
        console.log('Initializing Store...');

        // 1. Try to load from API (Server)
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                const serverData = await response.json();
                if (serverData) {
                    this.data = serverData;
                    this.useApi = true;
                    console.log('✅ Data loaded from Server (PHP API)');
                    return;
                }
            }
        } catch (e) {
            console.warn('⚠️ Server API not available, falling back to LocalStorage', e);
        }

        // 2. Fallback to LocalStorage
        const stored = localStorage.getItem(this.dbName);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                console.log('✅ Data loaded from LocalStorage');
            } catch (e) {
                console.error('Error parsing stored data:', e);
                this.reset();
            }
        } else {
            console.log('No data found, initializing empty DB');
            this.saveLocal();
        }
    }

    // Generic Getters
    getAll(collection) {
        return this.data[collection] || [];
    }

    getById(collection, id) {
        return this.data[collection].find(item => item.id === id);
    }

    // Generic Setters with API Sync
    async add(collection, item) {
        if (!this.data[collection]) this.data[collection] = [];
        this.data[collection].push(item);

        if (this.useApi) {
            try {
                const response = await fetch(`${this.apiUrl}?resource=${collection}&action=create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error:', errorText);
                    alert(`Error del servidor (${response.status}): ${errorText}`);
                    throw new Error(errorText);
                }
            } catch (e) {
                console.error('API Create Error:', e);
                alert('Error al guardar en el servidor. Verifica tu conexión.');
            }
        } else {
            this.saveLocal();
        }
        return item;
    }

    async update(collection, id, updates) {
        const index = this.data[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            // Merge updates
            const updatedItem = { ...this.data[collection][index], ...updates };
            this.data[collection][index] = updatedItem;

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedItem)
                    });
                } catch (e) {
                    console.error('API Update Error:', e);
                    alert('Error al actualizar en el servidor.');
                }
            } else {
                this.saveLocal();
            }
            return updatedItem;
        }
        return null;
    }

    async delete(collection, id) {
        const index = this.data[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[collection].splice(index, 1);

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                } catch (e) {
                    console.error('API Delete Error:', e);
                }
            } else {
                this.saveLocal();
            }
            return true;
        }
        return false;
    }

    async addBatch(collection, items) {
        if (!this.data[collection]) this.data[collection] = [];
        this.data[collection].push(...items);

        if (this.useApi) {
            try {
                const response = await fetch(`${this.apiUrl}?resource=${collection}&action=batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(items)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API Batch Error (${collection}):`, errorText);
                    alert(`Error al importar ${collection}: ${errorText}`);
                    throw new Error(errorText);
                }
            } catch (e) {
                console.error('Batch API Error:', e);
                throw e;
            }
        } else {
            this.saveLocal();
        }
        return items;
    }

    async updateBatch(collection, updates) {
        if (!this.data[collection]) return;

        for (const update of updates) {
            const index = this.data[collection].findIndex(item => item.id === update.id);
            if (index !== -1) {
                const fullItem = { ...this.data[collection][index], ...update };
                this.data[collection][index] = fullItem;

                if (this.useApi) {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullItem)
                    });
                }
            }
        }
        if (!this.useApi) this.saveLocal();
    }

    // --- DOCUMENT MANAGEMENT ---

    async addDocument(collection, parentId, doc) {
        // Find parent
        const parent = this.getById(collection, parentId);
        if (parent) {
            if (!parent.documents) parent.documents = [];
            parent.documents.push(doc);

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=addDocument`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parentId: parentId,
                            parentType: collection === 'importFiles' ? 'FILE' : 'SHIPMENT',
                            ...doc
                        })
                    });
                } catch (e) {
                    console.error('API Add Document Error:', e);
                    alert('Error al guardar documento.');
                }
            } else {
                this.saveLocal();
            }
        }
    }

    async deleteDocument(collection, parentId, docId) {
        const parent = this.getById(collection, parentId);
        if (parent && parent.documents) {
            parent.documents = parent.documents.filter(d => d.id !== docId);

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=deleteDocument`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: docId })
                    });
                } catch (e) {
                    console.error('API Delete Document Error:', e);
                }
            } else {
                this.saveLocal();
            }
        }
    }

    async addCost(collection, parentId, cost) {
        const parent = this.getById(collection, parentId);
        if (parent) {
            if (!parent.costs) parent.costs = [];
            parent.costs.push(cost);

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=addCost`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parentId: parentId,
                            parentType: collection === 'importFiles' ? 'FILE' : (collection === 'shipments' ? 'SHIPMENT' : 'CONSOLIDATION'),
                            ...cost
                        })
                    });
                } catch (e) {
                    console.error('API Add Cost Error:', e);
                    alert('Error al guardar costo.');
                }
            } else {
                this.saveLocal();
            }
        }
    }

    async deleteCost(collection, parentId, costId) {
        const parent = this.getById(collection, parentId);
        if (parent && parent.costs) {
            parent.costs = parent.costs.filter(c => c.id !== costId);

            if (this.useApi) {
                try {
                    await fetch(`${this.apiUrl}?resource=${collection}&action=deleteCost`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: costId })
                    });
                } catch (e) {
                    console.error('API Delete Cost Error:', e);
                }
            } else {
                this.saveLocal();
            }
        }
    }

    async downloadDocument(id) {
        if (this.useApi) {
            try {
                const response = await fetch(`${this.apiUrl}?action=downloadDocument&id=${id}`);
                const result = await response.json();
                if (result.status === 'success') {
                    return result.url; // Base64 content
                } else {
                    throw new Error(result.message);
                }
            } catch (e) {
                console.error('Download Error:', e);
                alert('Error al descargar el documento.');
                return null;
            }
        } else {
            // LocalStorage fallback (should have url already if local)
            // But since we optimized the load, local storage might also need optimization if we were persisting it.
            // For now, assume local storage still has full objects or this is API only feature.
            const allDocs = this.getAll('documents'); // This might be empty if we rely on parent.documents
            // In our structure, documents are inside parents.
            // We need to search in all parents? Or just assume we have the object if local.
            // If local, we probably didn't strip the URL.
            return null;
        }
    }

    // --- UTILS ---

    saveLocal() {
        localStorage.setItem(this.dbName, JSON.stringify(this.data));
    }

    async reset() {
        if (this.useApi) {
            try {
                await fetch(`${this.apiUrl}?action=reset&resource=all`, { method: 'POST' });
            } catch (e) {
                console.error('API Reset Error:', e);
                alert('Error al reiniciar base de datos remota.');
            }
        }

        this.data = {
            suppliers: [],
            materials: [],
            importFiles: [],
            shipments: [],
            documents: [],
            financials: [],
            savingsProjects: [],
            savingsEntries: []
        };
        if (!this.useApi) this.saveLocal();
        console.log('Database reset complete');
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    async importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            // Basic validation
            if (!parsed.suppliers || !parsed.importFiles) {
                throw new Error('Formato de datos inválido');
            }
            this.data = parsed;
            await this.saveLocal(); // Fixed: was this.save()
            return { success: true };
        } catch (e) {
            console.error('Import failed:', e);
            return { success: false, message: e.message };
        }
    }
}
