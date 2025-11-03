import { signIn, signUp, signOut, session } from '../database.js';

// --- MESSAGE UTILITIES ---
const getMessageElement = (elementId) => document.getElementById(elementId);

const displayMessage = (message, type, elementId) => {
    const element = getMessageElement(elementId);
    if (element) {
        element.textContent = message;
        element.className = `${type}-message`;
        element.style.display = 'block';
        return element;
    }
    console.error(`Message element with ID '${elementId}' not found.`);
    return null;
};

const hideMessage = (elementId) => {
    const element = getMessageElement(elementId);
    if (element) {
        element.style.display = 'none';
        element.textContent = '';
    }
};

const showError = (message, elementId = 'error-message') => {
    const element = displayMessage(message, 'error', elementId);
    if (element) setTimeout(() => hideMessage(elementId), 5000);
};

const showSuccess = (message, elementId = 'success-message') => {
    const element = displayMessage(message, 'success', elementId);
    if (element) setTimeout(() => hideMessage(elementId), 3000);
};

const showLoading = (message, elementId = 'loading-message') => {
    displayMessage(message, 'loading', elementId);
};

const clearAllMessages = () => {
    ['login-error', 'signup-error', 'error-message', 'success-message', 'loading-message'].forEach(hideMessage);
};

// --- VALIDATION FUNCTIONS ---
const validateEmail = (email) => /^[^S@]+@[^S@]+\.[^S@]+$/.test(email);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
const validateName = (name) => /^[a-zA-Z\s\-']{2,50}$/.test(name);

// --- EVENT HANDLER FACTORY ---
const createAuthEventHandler = (handlerFn, messageElementId) => async (event) => {
    if (event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter')) {
        event.preventDefault();
        clearAllMessages();
        await handlerFn(messageElementId);
    }
};

// --- LOGIN LOGIC ---
const handleLogin = async (messageElementId) => {
    const email = document.getElementById("login-email")?.value;
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
        showError("Please fill in all fields", messageElementId);
        return;
    }
    if (!validateEmail(email)) {
        showError("Please enter a valid email address", messageElementId);
        return;
    }

    showLoading("Signing you in...", messageElementId);
    try {
        const loginCheck = await signIn(email, password);
        if (loginCheck.error || !loginCheck.data?.user) {
            showError("Invalid email or password. Please try again.", messageElementId);
            return;
        }
        showSuccess("Login successful! Redirecting...", messageElementId);
        setTimeout(() => {
            window.location.href = "../home/index.html";
        }, 1000);
    } catch (error) {
        showError("Login failed. Please check your connection and try again.", messageElementId);
        console.error("Login error:", error);
    }
};

const loginBtn = document.querySelector(".signinBtn");
if (loginBtn) {
    const loginEventHandler = createAuthEventHandler(handleLogin, 'login-error');
    loginBtn.addEventListener("click", loginEventHandler);
    loginBtn.addEventListener("keydown", loginEventHandler);
}

// --- REGISTER LOGIC ---
const handleRegister = async (messageElementId) => {
    const email = document.getElementById("sign-up-email")?.value;
    const password = document.getElementById("sign-up-password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const first_name = document.getElementById("firstName")?.value;
    const last_name = document.getElementById("lastName")?.value;

    if (!email || !password || !confirmPassword || !first_name || !last_name) {
        showError("Please fill in all fields", messageElementId);
        return;
    }
    if (!validateEmail(email)) {
        showError("Please enter a valid email address", messageElementId);
        return;
    }
    if (!validateName(first_name)) {
        showError("First name must be 2-50 characters and contain only letters", messageElementId);
        return;
    }
    if (!validateName(last_name)) {
        showError("Last name must be 2-50 characters and contain only letters", messageElementId);
        return;
    }
    if (!validatePassword(password)) {
        showError("Password must be at least 8 characters with uppercase, lowercase, and number", messageElementId);
        return;
    }
    if (password !== confirmPassword) {
        showError("Passwords do not match", messageElementId);
        return;
    }

    showLoading("Creating your account...", messageElementId);
    try {
        const registering = await signUp(email, password, first_name, last_name);
        if (!registering.error) { // Check for no error to indicate success
            showSuccess("Registration successful! Redirecting to login...", messageElementId);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
            return;
        }
        showError(registering.error.message || "Registration failed. Please try again.", messageElementId);
    } catch (error) {
        showError("Registration failed. Please check your connection and try again.", messageElementId);
        console.error("Registration error:", error);
    }
};

const registerBtn = document.querySelector(".signupBtn");
if (registerBtn) {
    const registerEventHandler = createAuthEventHandler(handleRegister, 'signup-error');
    registerBtn.addEventListener("click", registerEventHandler);
    registerBtn.addEventListener("keydown", registerEventHandler);
}

// --- LOGOUT LOGIC ---
const handleLogout = async () => {
    try {
        const { error } = await signOut();
        if (!error) {
            console.log("Logout successful");
            localStorage.clear();
            window.location.href = "./login.html";
            return;
        }
        console.error("Logout failed:", error);
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const logoutBtnPrimary = document.querySelector(".logoutBtn.primary");
if (logoutBtnPrimary) {
    const logoutEventHandler = createAuthEventHandler(handleLogout, 'logout-error'); // Assuming a logout-error element exists
    logoutBtnPrimary.addEventListener("click", logoutEventHandler);
    logoutBtnPrimary.addEventListener("keydown", logoutEventHandler);
}

const logoutBtnSecondary = document.querySelector(".logoutBtn.secondary");
if (logoutBtnSecondary) {
    logoutBtnSecondary.addEventListener("click", async () => {
        const { session: currentSession } = await session(); // Fetch session only when needed
        if (currentSession) {
            window.location.href = "../home/index.html";
        }
    });
}
