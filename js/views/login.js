export class LoginView {
    constructor(authService) {
        this.auth = authService;
    }

    render() {
        return `
            <style>
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #fbfbfd; /* Apple-like light gray background */
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                
                .login-card {
                    width: 100%;
                    max-width: 380px;
                    padding: 40px;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    text-align: center;
                }

                .login-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1d1d1f;
                    margin-bottom: 8px;
                }

                .login-subtitle {
                    font-size: 15px;
                    color: #86868b;
                    margin-bottom: 32px;
                }

                .form-group {
                    margin-bottom: 20px;
                    text-align: left;
                }

                .form-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #86868b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    font-size: 17px;
                    border: 1px solid #d2d2d7;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.8);
                    transition: all 0.2s ease;
                    outline: none;
                    box-sizing: border-box; /* Fix padding issue */
                }

                .form-input:focus {
                    border-color: #0071e3;
                    box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
                }

                .btn-submit {
                    width: 100%;
                    padding: 14px;
                    font-size: 17px;
                    font-weight: 500;
                    color: white;
                    background: #0071e3;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    margin-top: 10px;
                }

                .btn-submit:hover {
                    background: #0077ed;
                }

                .btn-submit:active {
                    transform: scale(0.98);
                }

                .toggle-link {
                    display: block;
                    margin-top: 24px;
                    font-size: 14px;
                    color: #0071e3;
                    text-decoration: none;
                    cursor: pointer;
                }

                .toggle-link:hover {
                    text-decoration: underline;
                }
            </style>

            <div class="login-container">
                <div class="login-card">
                    <div style="margin-bottom: 20px;">
                        <span class="material-icons-round" style="font-size: 48px; color: #1d1d1f;">inventory_2</span>
                    </div>
                    
                    <div id="login-form-container">
                        <h2 class="login-title">Iniciar Sesión</h2>
                        <p class="login-subtitle">Bienvenido a IMS</p>
                        
                        <form id="form-login">
                            <div class="form-group">
                                <label class="form-label">Usuario</label>
                                <input type="text" id="login-username" class="form-input" placeholder="nombre.usuario" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contraseña</label>
                                <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="btn-submit">Entrar</button>
                        </form>
                        <a class="toggle-link" id="link-register">¿No tienes cuenta? Regístrate</a>
                    </div>

                    <div id="register-form-container" style="display: none;">
                        <h2 class="login-title">Crear Cuenta</h2>
                        <p class="login-subtitle">Únete al equipo</p>

                        <form id="form-register">
                            <div class="form-group">
                                <label class="form-label">Usuario</label>
                                <input type="text" id="reg-username" class="form-input" placeholder="nombre.usuario" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="reg-email" class="form-input" placeholder="nombre@empresa.com" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contraseña</label>
                                <input type="password" id="reg-password" class="form-input" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="btn-submit">Registrarse</button>
                        </form>
                        <a class="toggle-link" id="link-login">¿Ya tienes cuenta? Inicia Sesión</a>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const linkRegister = document.getElementById('link-register');
        const linkLogin = document.getElementById('link-login');
        const containerLogin = document.getElementById('login-form-container');
        const containerRegister = document.getElementById('register-form-container');

        // Toggle Forms
        linkRegister.addEventListener('click', (e) => {
            e.preventDefault();
            containerLogin.style.display = 'none';
            containerRegister.style.display = 'block';
        });

        linkLogin.addEventListener('click', (e) => {
            e.preventDefault();
            containerRegister.style.display = 'none';
            containerLogin.style.display = 'block';
        });

        // Handle Login
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('login-username').value;
            const pass = document.getElementById('login-password').value;

            const result = await this.auth.login(user, pass);
            if (result.success) {
                window.location.hash = '#dashboard';
                window.location.reload(); // Reload to init app with user
            } else {
                alert('Error: ' + result.message);
            }
        });

        // Handle Register
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;

            const result = await this.auth.register(user, email, pass);
            if (result.success) {
                alert('Registro exitoso. Por favor inicia sesión.');
                linkLogin.click();
            } else {
                alert('Error: ' + result.message);
            }
        });
    }
}
