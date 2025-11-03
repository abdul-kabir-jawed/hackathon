import { readAppointments, removeAppointmentFromArray } from "../database.js";

// --- UTILITIES ---

/**
 * Returns the number with its ordinal suffix (e.g., 1st, 2nd, 3rd).
 * @param {number} n - The number.
 * @returns {string} The number with its ordinal suffix.
 */
function getOrdinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// --- DOM ELEMENTS & SETUP ---

const appointmentsList = document.getElementById("appointmentsList");
const emptyState = document.getElementById("emptyState");

// --- NAVIGATION HANDLERS ---

// Close mobile nav when a link is clicked
document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.checked = false;
        }
    });
});

// Navigate to the booking page
document.querySelectorAll('.contact-btn, .book-now-btn').forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = '../appointment-page/appointment-page.html';
    });
});



// --- APPOINTMENT CANCELLATION ---

/**
 * Handles clicks on the appointments list, delegating to cancel buttons.
 * @param {Event} event The click event.
 */
async function handleAppointmentListClick(event) {
    if (!event.target.classList.contains('cancel-btn')) {
        return;
    }

    const button = event.target;
    const appointmentCard = button.closest('.appointment-card');
    const index = parseInt(appointmentCard.dataset.index, 10);
    const rowId = appointmentCard.dataset.rowId;

    if (isNaN(index) || !rowId) {
        alert("Error: Could not identify the appointment to cancel.");
        return;
    }

    button.disabled = true;
    button.textContent = "Cancelling...";

    try {
        const { error } = await removeAppointmentFromArray(rowId, index);
        if (error) {
            throw new Error(error.message);
        }
        // Reload to reflect the change, as per original logic
        window.location.reload();
    } catch (err) {
        alert("Failed to cancel appointment. Please try again.");
        console.error("Cancellation failed:", err);
        button.disabled = false;
        button.textContent = "Cancel";
    }
}

// Attach single event listener for the list
if (appointmentsList) {
    appointmentsList.addEventListener('click', handleAppointmentListClick);
}

// --- DATA RENDERING ---

/**
 * Creates the HTML string for a single appointment card.
 * @param {object} appointment - The appointment data.
 * @param {number} index - The index of the appointment.
 * @param {string} rowId - The ID of the database row containing the appointments array.
 * @returns {string} HTML string for the card.
 */
function createAppointmentCardHTML(appointment, index, rowId) {
    return `
        <div class="appointment-card" data-index="${index}" data-row-id="${rowId}">
            <div class="doctor-info">
                <div class="doctor-name">${appointment.doctorName}</div>
                <div class="specialty">${appointment.doctorExpertise}</div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fa-solid fa-bullseye"></i>
                        <span>${appointment.reason}</span>
                    </div>
                </div>
            </div>
            <div class="datetime-info">
                <div class="detail-item">
                    <i class="fa-regular fa-calendar"></i>
                    <span class="date-time">${appointment.date}, ${getOrdinal(appointment.week)} week of ${appointment.month}</span>
                </div>
                <div class="detail-item">
                    <i class="fa-regular fa-clock"></i>
                    <span class="date-time">${appointment.time}</span>
                </div>
            </div>
            <button class="cancel-btn">Cancel</button>
        </div>`;
}

/**
 * Fetches and renders all appointments for the user.
 */
async function renderAppointments() {
    if (!appointmentsList || !emptyState) {
        console.error("Required elements for rendering appointments are not found.");
        return;
    }

    try {
        const { data, error } = await readAppointments();
        if (error) {
            throw new Error(error.message);
        }

        const record = data?.[0];
        const appointments = record?.appointments || [];
        const appointmentRowId = record?.id;

        if (appointments.length === 0) {
            appointmentsList.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            const appointmentsHTML = appointments.map((app, i) => createAppointmentCardHTML(app, i, appointmentRowId)).join('');
            appointmentsList.innerHTML = appointmentsHTML;
            appointmentsList.style.display = 'block';
            emptyState.style.display = 'none';
        }
    } catch (err) {
        console.error("Failed to load appointments:", err);
        appointmentsList.innerHTML = `<p class="error-message">Could not load appointments. Please try again later.</p>`;
        emptyState.style.display = 'none';
    }
}

// --- INITIALIZATION ---
renderAppointments();
