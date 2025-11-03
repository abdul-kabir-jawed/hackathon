
import { session } from '../database.js';

async function protectPage() {
    const { data, error } = await session();
    if (error || !data.session) {
        window.location.href = '../auth/login.html';
    }
}

protectPage();
