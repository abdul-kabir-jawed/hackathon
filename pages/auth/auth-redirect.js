
import { session } from '../database.js';

async function redirectIfLoggedIn() {
    const { data, error } = await session();
    if (data.session) {
        window.location.href = '../auth/logout.html';
    }
}

redirectIfLoggedIn();
