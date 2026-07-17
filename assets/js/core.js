async function loadSeries() {
    try {
        const response = await fetch('data/series.json');
        const series = await response.json();
        const grid = document.getElementById('series-grid');
        
        if(!grid) return;
        grid.innerHTML = ''; // Loader'ı temizle

        series.forEach(s => {
            grid.innerHTML += `
                <div class="bookItem">
                    <a href="seri-detay.html?id=${s.id}">
                        <div class="snippet-thumbnail">
                            <img src="${s.thumb}" alt="${s.title}">
                        </div>
                    </a>
                    <div class="data">
                        <h2><a href="seri-detay.html?id=${s.id}">${s.title}</a></h2>
                        <div class="tags" style="text-align:center; font-size:10px; opacity:0.7;">
                            ${s.type.toUpperCase()} • ${s.status}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Galaksi yüklenirken bir kara delik oluştu:", e);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', loadSeries);
