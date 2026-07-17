// assets/js/app.js

// Global Veri Havuzu
let allSeries = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchMainData();
    initDarkModeUI();
});

// Karanlık Mod Arayüz Tetikleyicisi
function initDarkModeUI() {
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        toggle.checked = document.body.classList.contains("dark-mode");
    }
}

function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('mode', 'light');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('mode', 'darkmode');
    }
}

// Zaman Farkı Hesaplayıcı (Örn: 2 gün önce, Az önce)
function timeAgo(dateString) {
    if (!dateString) return "...";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika önce";
    return "Az önce";
}

// GitHub Pages Üzerinden series.json Verisini Çek
function fetchMainData() {
    fetch("data/series.json")
        .then(res => {
            if (!res.ok) throw new Error("Veri dosyası bulunamadı.");
            return res.json();
        })
        .then(data => {
            allSeries = data;
            renderSlider();
            renderNovels();
            renderMangas();
            renderPopulars();
            initLiveSearch();
        })
        .catch(err => {
            console.error("Veri yüklenirken hata oluştu:", err);
            const slider = document.getElementById("featuredSlider");
            if (slider) slider.innerHTML = `<p style="color:red; text-align:center; padding:50px;">Veriler yüklenemedi. Lütfen depoda veri olduğunu ve admin panelinden seri eklediğinizi onaylayın.</p>`;
        });
}

// 1. ÖNE ÇIKAN SLIDER (En Son Güncellenen Seriyi Gösterir)
function renderSlider() {
    const slider = document.getElementById("featuredSlider");
    if (!slider || allSeries.length === 0) return;

    // En son eklenen seriyi bulalım
    const featured = allSeries[allSeries.length - 1];
    
    // Puan yıldızlarını oluştur
    let stars = "";
    const scoreVal = parseFloat(featured.score) / 2;
    for (let i = 1; i <= 5; i++) {
        if (scoreVal >= i) stars += '<i class="fas fa-star" style="color: #ffc107;"></i>';
        else if (scoreVal >= i - 0.5) stars += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
        else stars += '<i class="far fa-star" style="color: #ffc107;"></i>';
    }

    slider.innerHTML = `
        <div class="slider-bg" style="background-image: url('${featured.cover}');"></div>
        <div class="slider-content">
            <a href="series.html?id=${featured.id}">
                <img src="${featured.cover}" class="slider-img" alt="${featured.title}">
            </a>
            <div class="slider-details">
                <h2 style="margin: 0 0 10px 0; font-size: 28px; text-shadow: 2px 2px 8px rgba(0,0,0,0.8);">${featured.title}</h2>
                <div style="margin-bottom: 10px;">${stars} <span style="font-size: 13px; color: #ffc107;">(${featured.score})</span></div>
                <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                    <span class="tag" style="background: var(--primary-color); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">${featured.type}</span>
                    <span class="tag" style="background: #333; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">${featured.status}</span>
                </div>
                <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.8; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; max-width: 600px;">${featured.description}</p>
                <a href="series.html?id=${featured.id}" class="btn-submit" style="text-decoration: none; padding: 10px 25px;">HEMEN OKU</a>
            </div>
        </div>
    `;
}

// 2. YATAY SÜRGÜLÜ NOVELLER
function renderNovels() {
    const container = document.getElementById("Update");
    if (!container) return;

    // Sadece "Novel" tipindeki serileri filtreleyelim
    const novels = allSeries.filter(s => s.type === "Novel" || s.type === "Web Novel");

    if (novels.length === 0) {
        container.innerHTML = "<p style='color:#999; padding: 10px;'>Henüz novel yüklenmemiş.</p>";
        return;
    }

    container.innerHTML = "";
    novels.forEach(n => {
        container.innerHTML += `
            <div class="bookItem">
                <a href="series.html?id=${n.id}">
                    <div class="snippet-thumbnail">
                        <img src="${n.cover}" alt="${n.title}">
                        <span class="po novel">Novel</span>
                    </div>
                </a>
                <div class="data">
                    <h2><a href="series.html?id=${n.id}">${n.title}</a></h2>
                </div>
            </div>
        `;
    });
}

// 3. SON GÜNCELLENEN MANGALAR/WEBTOONLAR
function renderMangas() {
    const container = document.getElementById("myManga");
    if (!container) return;

    // Novel olmayan serileri getirelim
    const mangas = allSeries.filter(s => s.type !== "Novel" && s.type !== "Web Novel");

    if (mangas.length === 0) {
        container.innerHTML = "<p style='color:#999; padding: 10px;'>Henüz seri yüklenmemiş.</p>";
        return;
    }

    container.innerHTML = "";
    mangas.forEach(m => {
        // En son yüklenen 3 bölümü listeleyelim
        let chapterListHtml = "";
        const chapters = m.chapters || [];
        const recentChapters = chapters.slice(-3).reverse(); // Son 3 bölümü tersten al

        recentChapters.forEach(ch => {
            chapterListHtml += `
                <li>
                    <a href="okuyucu.html?series=${m.id}&chapter=${ch.id}" style="color: inherit; font-weight: bold;">${ch.title}</a>
                    <span style="opacity: 0.6; font-size: 9px;">${timeAgo(ch.date)}</span>
                </li>
            `;
        });

        const badgeClass = m.type.toLowerCase();

        container.innerHTML += `
            <div class="bookItem">
                <a href="series.html?id=${m.id}">
                    <div class="snippet-thumbnail">
                        <img src="${m.cover}" alt="${m.title}">
                        <span class="po ${badgeClass}">${m.type}</span>
                    </div>
                </a>
                <div class="data">
                    <h2><a href="series.html?id=${m.id}">${m.title}</a></h2>
                    <ul class="subItem">
                        ${chapterListHtml ? chapterListHtml : "<li style='opacity:0.6;'>Bölüm bulunmuyor.</li>"}
                    </ul>
                </div>
            </div>
        `;
    });
}

// 4. SIDEBAR - EN ÇOK SEVİLENLER (Puanı En Yüksek 5 Seri)
function renderPopulars() {
    const container = document.getElementById("popularSidebar");
    if (!container) return;

    // Puanlarına göre büyükten küçüğe sıralayalım
    const sorted = [...allSeries].sort((a, b) => parseFloat(b.score) - parseFloat(a.score)).slice(0, 5);

    container.innerHTML = "";
    sorted.forEach((s, index) => {
        container.innerHTML += `
            <div style="display: flex; gap: 10px; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                <span style="font-size: 20px; font-weight: 800; color: var(--primary-color); width: 25px; text-align: center;">${index + 1}</span>
                <img src="${s.cover}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 6px;" alt="${s.title}">
                <div style="flex: 1; min-width: 0;">
                    <h4 style="margin: 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><a href="series.html?id=${s.id}">${s.title}</a></h4>
                    <small style="color: #ffc107; font-weight: bold;"><i class="fas fa-star"></i> ${s.score}</small>
                    <span style="font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 10px; color: #333;">${s.type}</span>
                </div>
            </div>
        `;
    });
}

// 5. CANLI ARAMA MOTORU
function initLiveSearch() {
    const searchInput = document.getElementById("liveSearchInput");
    const resLive = document.getElementById("resLive");

    if (!searchInput || !resLive) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query === "") {
            resLive.classList.remove("active");
            resLive.innerHTML = "";
            return;
        }

        const filtered = allSeries.filter(s => 
            s.title.toLowerCase().includes(query) || 
            (s.altTitle && s.altTitle.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            resLive.innerHTML = `<div style="padding: 15px; color: white; text-align:center;">Sonuç bulunamadı...</div>`;
            resLive.classList.add("active");
            return;
        }

        resLive.innerHTML = "";
        filtered.forEach(s => {
            resLive.innerHTML += `
                <a href="series.html?id=${s.id}" style="text-decoration:none;">
                    <div class="live-search-item">
                        <img src="${s.cover}" alt="${s.title}">
                        <div>
                            <strong>${s.title}</strong><br>
                            <small style="opacity:0.7;">${s.type} - Puan: ${s.score}</small>
                        </div>
                    </div>
                </a>
            `;
        });
        resLive.classList.add("active");
    });

    // Arama kutusu dışına tıklayınca canlı arama listesini gizle
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !resLive.contains(e.target)) {
            resLive.classList.remove("active");
        }
    });
}
