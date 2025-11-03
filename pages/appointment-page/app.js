import { getAllDoctors, addAppointments } from "../database.js";

// Month helpers
const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

function getAllowedMonths() {
    const now = new Date();
    const months = [];
    for (let i = 0; i <= 3; i++) { // current month + next 3 months max
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push(MONTH_NAMES[d.getMonth()]);
    }
    return months;
}

function populateMonthSelect(selectEl) {
    const allowed = getAllowedMonths();
    selectEl.innerHTML = `
        <option value="" disabled selected>Select a month</option>
        ${allowed.map(m => `<option value="${m}">${m}</option>`).join("")}
    `;
}

function populateWeekSelect(selectEl) {
    selectEl.innerHTML = `
        <option value="" disabled selected>Select a week</option>
        <option value="1">Week 1</option>
        <option value="2">Week 2</option>
        <option value="3">Week 3</option>
        <option value="4">Week 4</option>
    `;
}

// Function to open the booking modal with doctor's information
function openModal(doctor, specialty, days, time) {
    document.getElementById('doctorInfo').textContent = `${doctor} - ${specialty}`;
    const daysArray = days.split(",").map(d => d.trim());
    const timeArray = time.split(",").map(t => t.trim());

    document.getElementById("day").innerHTML = `
        <option value="">Select a Day</option>
        ${daysArray.map(day => `<option value="${day}">${day}</option>`).join('')}
    `;

    document.getElementById("time").innerHTML = `
        <option value="">Select a Time</option>
        ${timeArray.map(t => `<option value="${t}">${t}</option>`).join('')}
    `;

    // populate month and week with constraints
    const monthSelect = document.getElementById('month');
    const weekSelect = document.getElementById('week');
    if (monthSelect) populateMonthSelect(monthSelect);
    if (weekSelect) populateWeekSelect(weekSelect);

    document.getElementById('bookingModal').classList.add('active');
    document.getElementById('formView').style.display = 'block';
    document.getElementById('successView').classList.remove('active');
}

// Function to close the booking modal
function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
    document.getElementById('bookingForm').reset();
}

// Function to handle form submission
function submitBooking(event) {
    event.preventDefault();
    document.getElementById('formView').style.display = 'none';
    document.getElementById('successView').classList.add('active');
}

// Function to confirm an appointment
async function appointmentConfirm(doctorName, doctorExpertise, month, week, date, time, reason) {
    const newAppointment = { doctorName:doctorName, doctorExpertise:doctorExpertise, month: month ,week: week, date:date, time:time, reason:reason };
    const data = await addAppointments(newAppointment);
    console.log(data);
}

// Function to populate doctor cards
function feedDoctors(image, name, spec, days, time) {
    document.getElementsByClassName("doctors-grid")[0].innerHTML += `
        <div class="doctor-card" data-days="${days}" data-time="${time}">
            <img src="${image}" class="doctor-avatar" alt="doctor">
            <div class="doctor-name">${name}</div>
            <div class="doctor-specialty">${spec}</div>
            <div class="availability">
                <div class="availability-label">Available Days</div>
                <div class="availability-info">${days}</div>
            </div>
            <div class="availability">
                <div class="availability-label">Time Slots</div>
                <div class="availability-info">${time[0]} - ${time[time.length - 1]}</div>
            </div>
            <button class="book-btn">Book Now</button>
        </div>`;
}

// Main function to fetch doctors and set up event listeners
async function initializePage() {
    const doctors = (await getAllDoctors()).data;
    console.log(doctors);

    doctors.forEach((doc) => feedDoctors(doc.image, doc.name, doc.doctor_expertise, doc.available_days, doc.available_times));

    // Event listener for closing the modal
    document.getElementById('bookingModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Event listener for nav links to close the mobile menu
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function () {
            document.getElementById('navToggle').checked = false;
        });
    });

    // Event listener for the close button in the success message
    document.getElementsByClassName("confirm-btn-close")[0].addEventListener("click", closeModal);

    // Event listener for the booking form submission
    document.getElementById("bookingForm").addEventListener("submit", (event) => submitBooking(event));

    // Event listener for the close button in the form
    document.getElementsByClassName("close-btn-form")[0].addEventListener("click", closeModal);

    // Event listeners for the "Book Now" buttons on doctor cards
    const bookButtons = document.getElementsByClassName("book-btn");
    Array.from(bookButtons).forEach((btn) => {
        btn.addEventListener("click", () => {
            const doctorCard = btn.closest(".doctor-card");
            const days = doctorCard.getAttribute("data-days");
            const time = doctorCard.getAttribute("data-time");
            const doctorName = doctorCard.querySelector(".doctor-name").textContent;
            const doctorSpec = doctorCard.querySelector(".doctor-specialty").textContent;

            openModal(doctorName, doctorSpec, days, time);
        });
    });

    // Event listener for the confirm appointment button
    const confirmButtons = document.getElementsByClassName("confirm-btn");
    Array.from(confirmButtons).forEach((btn) => {
        btn.addEventListener("click", async () => {
            const doctorInfo = document.getElementById("doctorInfo");
            if (!doctorInfo) {
                console.error("doctorInfo element not found!");
                return;
            }

            const infoText = doctorInfo.textContent.trim();
            const [doctorName, doctorSpec] = infoText.split(" - ").map((s) => s.trim());
            const preferredDay = document.getElementById("day").value;
            const preferredTime = document.getElementById("time").value;
            const preferredMonth = document.getElementById("month").value;
            const preferredWeek = document.getElementById("week").value;

            const reason = document.getElementById("reason").value;

            // Validation: month within next 3 months
            const allowedMonths = getAllowedMonths();
            if (!allowedMonths.includes(preferredMonth)) {
                alert(`Please select a month within the next 3 months: ${allowedMonths.join(', ')}`);
                return;
            }

            // Validation: time must be one of the available time options
            const timeOptions = Array.from(document.getElementById("time").options).map(o => o.value).filter(Boolean);
            if (!timeOptions.includes(preferredTime)) {
                alert("Please select a valid time from the list.");
                return;
            }

            // Validation: day must be one of the available day options
            const dayOptions = Array.from(document.getElementById("day").options).map(o => o.value).filter(Boolean);
            if (!dayOptions.includes(preferredDay)) {
                alert("Please select a valid day from the list.");
                return;
            }

            await appointmentConfirm(doctorName, doctorSpec, preferredMonth, preferredWeek, preferredDay, preferredTime, reason);
        });
    });
}

// Initialize the page
initializePage();