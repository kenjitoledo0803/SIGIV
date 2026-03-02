export class AuthService {
    constructor() {
        this.apiUrl = 'api/auth.php';
        this.currentUser = null;
        this.isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.apiUrl}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // Handle Non-JSON response (e.g. Python server returning HTML/Text)
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // If parsing fails and we are in Dev, simulate success
                if (this.isDev) {
                    console.warn('⚠️ Dev Mode: Using LocalStorage Mock Auth');
                    return this.mockLogin(username, password);
                }
                throw new Error('Invalid server response');
            }

            if (response.ok) {
                this.currentUser = data.user;
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (e) {
            if (this.isDev) {
                console.warn('⚠️ Dev Mode: Using LocalStorage Mock Auth (Network Error)');
                return this.mockLogin(username, password);
            }
            return { success: false, message: 'Error de conexión' };
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (this.isDev) {
                    console.warn('⚠️ Dev Mode: Using LocalStorage Mock Register');
                    return this.mockRegister(username, email, password);
                }
                throw new Error('Invalid server response');
            }

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (e) {
            if (this.isDev) {
                return this.mockRegister(username, email, password);
            }
            return { success: false, message: 'Error de conexión' };
        }
    }

    // --- MOCK AUTH METHODS (For Local Dev) ---
    mockLogin(username, password) {
        const users = this.getMockUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = { id: user.id, username: user.username, role: user.role };
            localStorage.setItem('ims_dev_user', JSON.stringify(this.currentUser));
            return { success: true };
        } else {
            return { success: false, message: 'Usuario o contraseña incorrectos (Dev Mode)' };
        }
    }

    mockRegister(username, email, password) {
        const users = this.getMockUsers();

        if (users.find(u => u.username === username)) {
            return { success: false, message: 'El usuario ya existe' };
        }

        const newUser = {
            id: 'user-' + Date.now(),
            username,
            email,
            password, // In real app, this would be hashed. In dev mock, plain text is fine.
            role: 'USER'
        };

        users.push(newUser);
        localStorage.setItem('ims_users', JSON.stringify(users));
        return { success: true };
    }

    getMockUsers() {
        const stored = localStorage.getItem('ims_users');
        if (!stored) {
            // Default Admin
            const defaultUsers = [
                { id: 'admin-1', username: 'admin', email: 'admin@test.com', password: 'admin', role: 'ADMIN' }
            ];
            localStorage.setItem('ims_users', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(stored);
    }

    async logout() {
        if (this.isDev) {
            localStorage.removeItem('ims_dev_user');
            this.currentUser = null;
            return;
        }
        await fetch(`${this.apiUrl}?action=logout`, { method: 'POST' });
        this.currentUser = null;
    }

    async checkAuth() {
        // 1. Check Dev Mode LocalStorage first
        if (this.isDev) {
            const stored = localStorage.getItem('ims_dev_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
                return true;
            }
        }

        try {
            const response = await fetch(`${this.apiUrl}?action=me`);
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                return true;
            }
        } catch (e) {
            console.error('Auth check failed', e);
        }
        this.currentUser = null;
        return false;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}
