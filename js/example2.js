document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btn-open");
  const overlay = document.getElementById("welcome-overlay");
  const body = document.getElementById("body-content");
  const audio = document.getElementById("bg-music");
  const musicBtn = document.getElementById("music-control");
  const musicIcon = document.getElementById("music-icon");
  let isMusicPlaying = false;

  // 1. Logika Buka Undangan
  btnOpen.addEventListener("click", () => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.visibility = "hidden";
      body.style.overflow = "auto"; // Aktifkan scroll

      audio.volume = 0.5;
      audio
        .play()
        .then(() => {
          isMusicPlaying = true;
        })
        .catch((err) => console.log("Autoplay blocked"));

      reveal();
    }, 1000);
  });

  // 2. Logika Play/Pause Musik
  musicBtn.addEventListener("click", () => {
    if (isMusicPlaying) {
      audio.pause();
      musicIcon.classList.remove("spin");
      musicIcon.className = "fa-solid fa-music";
    } else {
      audio.play();
      musicIcon.className = "fa-solid fa-compact-disc spin";
    }
    isMusicPlaying = !isMusicPlaying;
  });

  // 3. Scroll Reveal Animation & Active Nav Link update
  const sections = document.querySelectorAll("section, header");
  const navLinks = document.querySelectorAll(".nav-item-bottom");

  function reveal() {
    // Scroll reveal
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 100;

      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      }
    }

    // Update active nav link based on scroll
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= sectionTop - 150) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href").includes(current)) {
        link.classList.add("active");
      }
    });
  }
  window.addEventListener("scroll", reveal);

  // 4. Simulasi Form RSVP
  document.getElementById("rsvpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-rsvp");
    const alert = document.getElementById("rsvp-alert");

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = "Konfirmasi";
      btn.disabled = false;
      alert.classList.remove("d-none");
      this.reset();

      setTimeout(() => {
        alert.classList.add("d-none");
      }, 4000);
    }, 1500);
  });

  // 5. Simulasi Form Guestbook
  document.getElementById("wishForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("wishName").value;
    const message = document.getElementById("wishMessage").value;
    const list = document.getElementById("wishesList");

    const newItem = document.createElement("div");
    newItem.className =
      "border-bottom border-secondary border-opacity-50 pb-3 mb-3 reveal active";
    newItem.innerHTML = `
                    <h6 class="fw-bold mb-1 text-gold font-elegant">${name}</h6>
                    <p class="mb-1 small text-light fw-light">${message}</p>
                    <small class="text-muted" style="font-size: 0.7rem;">Baru saja</small>
                `;

    list.insertBefore(newItem, list.firstChild);
    this.reset();
  });
});

// 6. Fungsi Copy Clipboard
function copyClipboard(elementId) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast();
    })
    .catch((err) => {
      const tempInput = document.createElement("input");
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      showToast();
    });
}

function showToast() {
  const toastEl = document.getElementById("copyToast");
  // eslint-disable-next-line no-undef
  const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
  toast.show();
}

// 7. Integrasi Gemini API untuk Generator Ucapan (AI Wishes)
const apiKey = ""; // Disediakan oleh environment otomatis

async function fetchWithBackoff(url, options, maxRetries = 5) {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((res) => setTimeout(res, delays[i]));
    }
  }
}

document
  .getElementById("btnGenerateWish")
  .addEventListener("click", async () => {
    const relation = document.getElementById("aiRelation").value;
    const tone = document.getElementById("aiTone").value;
    const btn = document.getElementById("btnGenerateWish");
    const errorDiv = document.getElementById("aiError");

    const promptText = `Buatkan ucapan selamat pernikahan yang mewah dan elegan dalam bahasa Indonesia untuk pasangan bernama Leo dan Zara. Saya adalah ${relation} dari mereka. Tolong gunakan gaya bahasa yang ${tone}. Maksimal 2 paragraf singkat. Langsung berikan hasil ucapannya.`;

    btn.disabled = true;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin me-2"></i>Merangkai...';
    errorDiv.classList.add("d-none");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: {
          parts: [
            {
              text: "Anda adalah asisten yang menulis dengan gaya elegan, formal, dan puitis. Jangan berikan pengantar, hanya teks ucapan saja.",
            },
          ],
        },
      };

      const data = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        document.getElementById("wishMessage").value = generatedText.trim();
        const modalEl = document.getElementById("aiWishModal");
        // eslint-disable-next-line no-undef
        const modalInstance =
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
      } else {
        throw new Error("Gagal memuat teks.");
      }
    } catch (err) {
      console.error(err);
      errorDiv.innerText = "Koneksi ke AI gagal. Silakan coba lagi.";
      errorDiv.classList.remove("d-none");
    } finally {
      btn.disabled = false;
      btn.innerHTML = "✨ Generate";
    }
  });
