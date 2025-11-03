import { getAllDoctors } from "../database.js"

const appointmentBookBtn = document.getElementsByClassName("contact-btn")[0]
const appointmentBookBtnSecond = document.getElementsByClassName("btn-primary")[0]

appointmentBookBtn.addEventListener("click", () => {
    window.location.href = "../appointment-page/appointment-page.html"
})
appointmentBookBtnSecond.addEventListener("click", () => {
    window.location.href = "../appointment-page/appointment-page.html"
})


document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', function () {
        document.getElementById('navToggle').checked = false;
    });
});


// doctor serction 
async function doctorCard() {
    const doctors = (await getAllDoctors()).data
    const doctorCarousel = document.getElementsByClassName("doctors-carousel")[0]
    for (let i = 0; i < doctors.length; i++) {
        doctorCarousel.innerHTML += `<div class="doctor-card">
                        <div class="doctor-image">
                            <img src="${doctors[i].image}" alt="doctor">
                        </div>
                        <h3 class="doctor-name">${doctors[i].name}</h3>
                        <p class="doctor-expertise">${doctors[i].doctor_expertise}</p>
                        <p class="doctor-info">${doctors[i].doctor_info}</p>
                    </div>`

    }

}

doctorCard()

