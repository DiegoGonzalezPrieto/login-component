// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');

// Form switching functionality
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
    clearMessages();
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    clearMessages();
});

// Clear all messages
function clearMessages() {
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    registerMessage.textContent = '';
    registerMessage.className = 'message';
}

// Show message helper function
function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.className = `message ${type}`;
}

// Clear input errors
function clearInputErrors() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.classList.remove('error'));
}

// Client-side validation
function validateLoginForm(email, password) {
    clearInputErrors();
    let isValid = true;

    if (!email.trim()) {
        document.getElementById('loginEmail').classList.add('error');
        showMessage(loginMessage, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('loginEmail').classList.add('error');
        showMessage(loginMessage, 'Please enter a valid email address');
        isValid = false;
    }

    if (!password.trim()) {
        document.getElementById('loginPassword').classList.add('error');
        showMessage(loginMessage, 'Password is required');
        isValid = false;
    }

    return isValid;
}

function validateRegisterForm(username, email, password, confirmPassword) {
    clearInputErrors();
    let isValid = true;

    if (!username.trim()) {
        document.getElementById('registerUsername').classList.add('error');
        showMessage(registerMessage, 'Username is required');
        isValid = false;
    } else if (username.length < 3) {
        document.getElementById('registerUsername').classList.add('error');
        showMessage(registerMessage, 'Username must be at least 3 characters long');
        isValid = false;
    }

    if (!email.trim()) {
        document.getElementById('registerEmail').classList.add('error');
        showMessage(registerMessage, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('registerEmail').classList.add('error');
        showMessage(registerMessage, 'Please enter a valid email address');
        isValid = false;
    }

    if (!password.trim()) {
        document.getElementById('registerPassword').classList.add('error');
        showMessage(registerMessage, 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById('registerPassword').classList.add('error');
        showMessage(registerMessage, 'Password must be at least 6 characters long');
        isValid = false;
    }

    if (!confirmPassword.trim()) {
        document.getElementById('confirmPassword').classList.add('error');
        showMessage(registerMessage, 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        document.getElementById('confirmPassword').classList.add('error');
        showMessage(registerMessage, 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!validateLoginForm(email, password)) {
        return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        submitBtn.classList.add('loading');

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(loginMessage, 'Login successful!', 'success');
            // Store token if provided
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            // Redirect or update UI as needed
            setTimeout(() => {
                alert('Welcome! You are now logged in.');
            }, 1000);
        } else {
            showMessage(loginMessage, data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(loginMessage, 'Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('loading');
    }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!validateRegisterForm(username, email, password, confirmPassword)) {
        return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        submitBtn.classList.add('loading');

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(registerMessage, 'Registration successful! Please login.', 'success');
            // Clear form
            registerForm.reset();
            // Switch to login form
            setTimeout(() => {
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
                clearMessages();
            }, 2000);
        } else {
            showMessage(registerMessage, data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(registerMessage, 'Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('loading');
    }
});

// Real-time validation
document.getElementById('loginEmail').addEventListener('blur', function() {
    if (this.value && !isValidEmail(this.value)) {
        this.classList.add('error');
    } else {
        this.classList.remove('error');
    }
});

document.getElementById('registerEmail').addEventListener('blur', function() {
    if (this.value && !isValidEmail(this.value)) {
        this.classList.add('error');
    } else {
        this.classList.remove('error');
    }
});

document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('registerPassword').value;
    if (this.value && this.value !== password) {
        this.classList.add('error');
    } else {
        this.classList.remove('error');
    }
}); 