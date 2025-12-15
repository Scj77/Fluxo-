const USERS = {
    admin: { senha: "ESPARTANO@2025", role: "admin" },
    cadastro: { senha: "123", role: "cadastro" },
    conciliacao: { senha: "123", role: "conciliacao" }
};

function login(event) {
    event.preventDefault();

    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("login-error");
    const loginButton = document.querySelector('.btn-login');
    const loginForm = document.getElementById('login-form');

    errorBox.style.display = "none";
    loginForm.classList.remove('shake');

    if (!user || !pass) {
        errorBox.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Por favor, preencha todos os campos!</span>';
        errorBox.style.display = "flex";
        loginForm.classList.add('shake');
        return;
    }

    const originalText = loginButton.innerHTML;
    loginButton.innerHTML = '<span>Autenticando...</span>';
    loginButton.classList.add('loading');

    setTimeout(() => {
        if (!USERS[user] || USERS[user].senha !== pass) {
            errorBox.style.display = "flex";
            loginForm.classList.add('shake');
            
            loginButton.innerHTML = originalText;
            loginButton.classList.remove('loading');
            
            return;
        }

        loginButton.innerHTML = '<span>Acesso Liberado</span><i class="fas fa-check"></i>';
        loginButton.style.background = 'linear-gradient(135deg, #00cc66 0%, #00ff88 100%)';
        
        localStorage.setItem("espartano_user", user);
        localStorage.setItem("espartano_role", USERS[user].role);

        setTimeout(() => {
            const role = USERS[user].role;
            let redirectPage = "index.html"; 

            if (role === "cadastro") {
                redirectPage = "data_entry.html";
            }

            window.location.href = redirectPage;
        }, 1000);

    }, 1000); 
}

function isLoggedIn() {
    return localStorage.getItem("espartano_user") !== null;
}

function checkPermission(allowedRoles) {
    const role = localStorage.getItem("espartano_role");

    if (!role) {
        window.location.href = "login.html";
        return false;
    }

    if (!allowedRoles.includes(role)) {
        showAccessDeniedModal();
        return false;
    }
    
    return true;
}

function showAccessDeniedModal() {
    alert("Acesso negado!\n\nVocê não tem permissão para acessar esta página.");
    // Redireciona para login ou outra página segura
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem("espartano_user");
    localStorage.removeItem("espartano_role");
    window.location.href = "login.html";
}

function getUserInfo() {
    return {
        username: localStorage.getItem("espartano_user"),
        role: localStorage.getItem("espartano_role")
    };
}

function fillTestCredentials(role) {
    let username, password;
    
    switch(role) {
        case 'admin':
            username = 'admin';
            password = 'ESPARTANO@2025';
            break;
        case 'cadastro':
            username = 'cadastro';
            password = '123';
            break;
        case 'conciliacao':
            username = 'conciliacao';
            password = '123';
            break;
        default:
            return;
    }
    
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    
    // Adicionar foco no botão de login
    document.querySelector('.btn-login').focus();
}