const GH_USER = "KullaniciAdin";
const GH_REPO = "RepoAdin";

async function publishToGithub(path, content, message) {
    const token = localStorage.getItem('gh_token');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${path}`;
    
    // Önce dosyanın mevcut SHA değerini almalıyız (Update için)
    let sha = "";
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        const data = await res.json();
        sha = data.sha;
    } catch (e) {}

    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))), // Base64 dönüşümü
        sha: sha
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if(response.ok) {
        alert("Başarıyla Galaksiye İşlendi!");
    } else {
        alert("Hata Oluştu!");
    }
}

// Örnek Kullanım:
function saveSeries() {
    const seriesData = {
        title: document.getElementById('s-title').value,
        type: document.getElementById('s-type').value,
        // ... diğer veriler
    };
    // data/series.json dosyasını güncelleme mantığı buraya gelecek
}
