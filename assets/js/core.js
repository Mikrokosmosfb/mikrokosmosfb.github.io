/* ============================================================
   MİKROKOSMOS ÇEKİRDEK MOTORU (Orijinal XML Mantığı)
   ============================================================ */

// 1. Okuma Geçmişi (XML'deki HISTORY Objesi)
var max_history = 50;
var HISTORY = {
    savename: "bm_history",
    getStored: function() {
        var e = localStorage.getItem(this.savename);
        return e ? JSON.parse(e) : {};
    },
    push: function(id, data) {
        var n = this.getStored();
        data.time = Date.now();
        n[id] = data;
        // Limit kontrolü
        var keys = Object.keys(n);
        if (keys.length > max_history) { delete n[keys[0]]; }
        localStorage.setItem(this.savename, JSON.stringify(n));
    }
};

// 2. Bölüm Seçici ve Navigasyon (XML'deki nPLPro Mantığı)
const nPLPro = {
    render: async function(seriId, currentNo) {
        try {
            const res = await fetch(`data/chapters/${seriId}.json`);
            const chapters = await res.json();
            const currentIndex = chapters.findIndex(c => c.no === currentNo);
            
            const prev = chapters[currentIndex - 1];
            const next = chapters[currentIndex + 1];

            const html = `
                <div class="npl-modern-dropdown">
                    <button class="npl-dropdown-toggle">
                        <span>Bölüm Seç: ${chapters[currentIndex].title}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="npl-dropdown-menu">
                        <ul class="npl-chapter-list">
                            ${chapters.map(c => `<li><a href="oku.html?seri=${seriId}&bolum=${c.no}">${c.title}</a></li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="inner_nPL">
                    ${prev ? `<a href="oku.html?seri=${seriId}&bolum=${prev.no}">← Önceki</a>` : '<a></a>'}
                    <a href="seri-detay.html?id=${seriId}">Liste</a>
                    ${next ? `<a href="oku.html?seri=${seriId}&bolum=${next.no}">Sonraki →</a>` : '<a></a>'}
                </div>
            `;
            document.querySelectorAll('.nPL-show').forEach(el => el.innerHTML = html);
        } catch (e) { console.error("Navigasyon yüklenemedi"); }
    }
};

// 3. Imgbox ve HTML Temizleyici (Webtoonlar için)
function cleanWebtoonContent(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const imgs = div.querySelectorAll('img');
    return Array.from(imgs).map(i => `<img src="${i.src}" loading="lazy" class="lazyload">`).join('');
}

// 4. Ana Sayfa Grid Render (Blogger bookItem tasarımı)
async function renderHomeGrid() {
    const grid = document.getElementById('myManga');
    if(!grid) return;
    
    const res = await fetch('data/series.json');
    const series = await res.json();
    
    grid.innerHTML = series.map(s => `
        <div class="bookItem bb-1pxsf">
            <a href="seri-detay.html?id=${s.id}" title="${s.title}">
                <div class="snippet-thumbnail">
                    <img src="${s.thumb}"/>
                    <span class="absolute po ${s.type}">${s.type.toUpperCase()}</span>
                </div>
            </a>
            <div class="data">
                <h2><a href="seri-detay.html?id=${s.id}">${s.title}</a></h2>
                <ul class="subItem">
                    <li class="char">Güncel Bölümler JSON'dan okunacak...</li>
                </ul>
            </div>
        </div>
    `).join('');
}
