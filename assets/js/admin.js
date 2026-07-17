// assets/js/admin.js

// Global Değişkenler
let gitConfig = {};
let allSeries = [];

// Sayfa Yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
    loadConfig();
    if (gitConfig.token) {
        document.getElementById("setupScreen").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        fetchSeriesList();
    }
});

// Ayarları localStorage'dan yükle
function loadConfig() {
    gitConfig = {
        user: localStorage.getItem("git_user"),
        repo: localStorage.getItem("git_repo"),
        branch: localStorage.getItem("git_branch") || "main",
        token: localStorage.getItem("git_token")
    };
    if (gitConfig.user) document.getElementById("githubUser").value = gitConfig.user;
    if (gitConfig.repo) document.getElementById("githubRepo").value = gitConfig.repo;
    if (gitConfig.branch) document.getElementById("githubBranch").value = gitConfig.branch;
    if (gitConfig.token) document.getElementById("githubToken").value = gitConfig.token;
}

// Ayarları kaydet ve girişi doğrula
function saveConfig() {
    const user = document.getElementById("githubUser").value.trim();
    const repo = document.getElementById("githubRepo").value.trim();
    const branch = document.getElementById("githubBranch").value.trim();
    const token = document.getElementById("githubToken").value.trim();

    const setupMsg = document.getElementById("setupMsg");

    if (!user || !repo || !branch || !token) {
        showStatus("setupMsg", "Lütfen tüm alanları doldurun!", "error");
        return;
    }

    // Basit bir API testi ile doğrulama yapalım
    const testUrl = `https://api.github.com/repos/${user}/${repo}`;
    fetch(testUrl, {
        headers: { "Authorization": `token ${token}` }
    })
    .then(res => {
        if (res.ok) {
            localStorage.setItem("git_user", user);
            localStorage.setItem("git_repo", repo);
            localStorage.setItem("git_branch", branch);
            localStorage.setItem("git_token", token);
            
            showStatus("setupMsg", "Bağlantı başarılı! Panel yükleniyor...", "success");
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showStatus("setupMsg", "Bağlantı başarısız! Lütfen kullanıcı adı, repo veya token bilgisini kontrol edin.", "error");
        }
    })
    .catch(err => {
        showStatus("setupMsg", "Hata: " + err.message, "error");
    });
}

// Bağlantıyı Kes
function logoutAdmin() {
    if (confirm("Yönetici bağlantısını kesmek istediğinize emin misiniz?")) {
        localStorage.clear();
        location.reload();
    }
}

// Tab Değiştirici
function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".admin-nav button").forEach(el => el.classList.remove("active"));

    document.getElementById(`tab-${tabName}`).classList.add("active");
    document.getElementById(`nav-${tabName}`).classList.add("active");

    if (tabName === "manage" || tabName === "chapters") {
        fetchSeriesList();
    }
}

// Bildirim Mesajı Göster
function showStatus(elementId, text, type) {
    const el = document.getElementById(elementId);
    el.innerText = text;
    el.className = `status-msg ${type}`;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.style.display = "none"; }, 8000);
}

// Türkçe Karakter Güvenli Base64 Kodlayıcı (UTF-8 Destekli)
function utf8_to_b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

// Base64 Çözücü
function b64_to_utf8(str) {
    return decodeURIComponent(escape(atob(str)));
}

// ID (Slug) Üretici (Türkçe karakterleri temizler)
function generateSlug(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')           // Boşlukları - yap
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\-]/g, '')    // İstenmeyen karakterleri sil
        .replace(/\-+/g, '-');          // Birden fazla - işaretini teke düşür
}

// --- GİTHUB API İLE DOSYA OKUMA VE YAZMA SİSTEMİ ---

// Depodan Dosya Getir
async function getGithubFile(path) {
    const url = `https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}/contents/${path}?ref=${gitConfig.branch}`;
    const response = await fetch(url, {
        headers: { "Authorization": `token ${gitConfig.token}` }
    });
    if (response.status === 404) {
        return { content: null, sha: null }; // Dosya henüz yoksa
    }
    const data = await response.json();
    return {
        content: b64_to_utf8(data.content),
        sha: data.sha
    };
}

// Depoya Dosya Yaz (Commit)
async function writeGithubFile(path, contentStr, sha = null, message = "Update file via Admin Panel") {
    const url = `https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}/contents/${path}`;
    const body = {
        message: message,
        content: utf8_to_b64(contentStr),
        branch: gitConfig.branch
    };
    if (sha) body.sha = sha;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${gitConfig.token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Commit hatası gerçekleşti");
    }
    return await response.json();
}

// --- SERİ İŞLEMLERİ ---

// Depodaki Serileri Çek
async function fetchSeriesList() {
    try {
        const fileData = await getGithubFile("data/series.json");
        if (fileData.content) {
            allSeries = JSON.parse(fileData.content);
            renderSeriesUI();
        } else {
            allSeries = [];
            renderSeriesUI();
        }
    } catch (err) {
        showStatus("globalMsg", "Seriler yüklenirken hata: " + err.message, "error");
    }
}

// Arayüzleri Seri Listesiyle Güncelle
function renderSeriesUI() {
    // 1. Bölüm Ekleme sayfasındaki select kutusunu doldur
    const select = document.getElementById("chapterSeriesSelect");
    if (select) {
        select.innerHTML = '<option value="">Lütfen bir seri seçin...</option>';
        allSeries.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.title}</option>`;
        });
    }

    // 2. Yönetim sekmesindeki listeyi doldur
    const listContainer = document.getElementById("seriesListContainer");
    if (listContainer) {
        if (allSeries.length === 0) {
            listContainer.innerHTML = "<p>Henüz eklenmiş bir seri bulunmuyor.</p>";
            return;
        }
        listContainer.innerHTML = "";
        allSeries.forEach(s => {
            listContainer.innerHTML += `
                <div class="series-list-item">
                    <span><strong>${s.title}</strong> (${s.type} - ${s.status})</span>
                    <button onclick="deleteSeries('${s.id}')"><i class="fa-solid fa-trash"></i> Sil</button>
                </div>
            `;
        });
    }
}

// Yeni Seri Kaydet (Submit)
async function submitSeries() {
    const title = document.getElementById("seriesTitle").value.trim();
    const altTitle = document.getElementById("seriesAltTitle").value.trim();
    const description = document.getElementById("seriesDescription").value.trim();
    const cover = document.getElementById("seriesCover").value.trim();
    const status = document.getElementById("seriesStatus").value;
    const type = document.getElementById("seriesType").value;
    const genresInput = document.getElementById("seriesGenres").value;
    const score = document.getElementById("seriesScore").value;
    const is18 = document.getElementById("seriesIs18").checked;

    if (!title || !description || !cover) {
        showStatus("globalMsg", "Lütfen tüm zorunlu alanları (Ad, Konu, Kapak Resmi) doldurun!", "error");
        return;
    }

    const seriesId = generateSlug(title);
    
    // Türleri diziye çevir
    const genres = genresInput.split(",").map(g => g.trim()).filter(g => g.length > 0);

    const newSeries = {
        id: seriesId,
        title: title,
        altTitle: altTitle,
        description: description,
        cover: cover,
        status: status,
        type: type,
        genres: genres,
        score: score,
        is18: is18,
        chapters: [] // Bölümlerin meta verileri buraya eklenecek
    };

    try {
        const fileData = await getGithubFile("data/series.json");
        let list = fileData.content ? JSON.parse(fileData.content) : [];
        
        // Eğer seri zaten varsa üzerine yazmak yerine uyaralım
        const existingIndex = list.findIndex(s => s.id === seriesId);
        if (existingIndex > -1) {
            if (!confirm("Bu isimde bir seri zaten mevcut. Güncellemek istiyor musunuz?")) {
                return;
            }
            // Mevcut serinin bölümlerini koruyalım
            newSeries.chapters = list[existingIndex].chapters || [];
            list[existingIndex] = newSeries;
        } else {
            list.push(newSeries);
        }

        await writeGithubFile("data/series.json", JSON.stringify(list, null, 2), fileData.sha, `${title} serisi eklendi/güncellendi`);
        showStatus("globalMsg", `"${title}" serisi başarıyla GitHub deponuza eklendi!`, "success");
        
        // Formu sıfırla
        document.getElementById("seriesTitle").value = "";
        document.getElementById("seriesAltTitle").value = "";
        document.getElementById("seriesDescription").value = "";
        document.getElementById("seriesCover").value = "";
        document.getElementById("seriesGenres").value = "";
        
        fetchSeriesList();
    } catch (err) {
        showStatus("globalMsg", "Seri kaydedilirken hata: " + err.message, "error");
    }
}

// Seri Sil
async function deleteSeries(id) {
    if (!confirm("Bu seriyi ve ona bağlı tüm meta verileri silmek istediğinize emin misiniz? (Depodaki bölüm içerik dosyaları manuel silinmelidir)")) {
        return;
    }

    try {
        const fileData = await getGithubFile("data/series.json");
        let list = JSON.parse(fileData.content);
        list = list.filter(s => s.id !== id);

        await writeGithubFile("data/series.json", JSON.stringify(list, null, 2), fileData.sha, `${id} serisi silindi`);
        showStatus("globalMsg", "Seri başarıyla silindi!", "success");
        fetchSeriesList();
    } catch (err) {
        showStatus("globalMsg", "Seri silinirken hata: " + err.message, "error");
    }
}

// --- BÖLÜM İŞLEMLERİ ---

// İçerik tipine göre text-area kutularını gizle/göster
function toggleContentInputs() {
    const type = document.getElementById("chapterContentType").value;
    if (type === "webtoon") {
        document.getElementById("webtoonInputArea").style.display = "block";
        document.getElementById("novelInputArea").style.display = "none";
    } else {
        document.getElementById("webtoonInputArea").style.display = "none";
        document.getElementById("novelInputArea").style.display = "block";
    }
}

// HTML kodlarından resim linklerini ayıklayan akıllı parser
function parseWebtoonImages(input) {
    const urls = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(input)) !== null) {
        urls.push(match[1]);
    }
    if (urls.length === 0) {
        // Eğer HTML bulunamadıysa her satırı bağımsız bir link say
        return input.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    }
    return urls;
}

// Yeni Bölüm Ekle ve Commit Et
async function submitChapter() {
    const seriesId = document.getElementById("chapterSeriesSelect").value;
    const title = document.getElementById("chapterTitle").value.trim();
    const is18 = document.getElementById("chapterIs18").checked;
    const contentType = document.getElementById("chapterContentType").value;

    if (!seriesId) {
        showStatus("globalMsg", "Lütfen bir seri seçin!", "error");
        return;
    }
    if (!title) {
        showStatus("globalMsg", "Lütfen bölüm başlığı girin!", "error");
        return;
    }

    const chapterId = generateSlug(title);
    let finalContent = "";

    if (contentType === "webtoon") {
        const rawContent = document.getElementById("webtoonContent").value;
        const parsedImages = parseWebtoonImages(rawContent);
        if (parsedImages.length === 0) {
            showStatus("globalMsg", "Lütfen webtoon resim linklerini veya embed kodlarını girin!", "error");
            return;
        }
        finalContent = parsedImages; // Resim linkleri dizisi olarak saklayacağız
    } else {
        const rawContent = document.getElementById("novelContent").value.trim();
        if (!rawContent) {
            showStatus("globalMsg", "Lütfen novel metnini boş bırakmayın!", "error");
            return;
        }
        finalContent = rawContent; // Doğrudan text metin
    }

    const chapterPayload = {
        seriesId: seriesId,
        chapterId: chapterId,
        title: title,
        type: contentType,
        is18: is18,
        date: new Date().toISOString().split('T')[0],
        content: finalContent
    };

    try {
        // 1. Bölümün ham içeriğini deponun "data/chapters/[seriesId]/[chapterId].json" konumuna kaydet
        const path = `data/chapters/${seriesId}/${chapterId}.json`;
        const existingFile = await getGithubFile(path);
        
        await writeGithubFile(path, JSON.stringify(chapterPayload, null, 2), existingFile.sha, `${seriesId} - ${title} içeriği eklendi`);

        // 2. Ana data/series.json dosyasını güncelle ve bu bölümün meta bilgisini serinin altına kaydet
        const seriesFileData = await getGithubFile("data/series.json");
        let seriesList = JSON.parse(seriesFileData.content);
        const targetSeriesIndex = seriesList.findIndex(s => s.id === seriesId);

        if (targetSeriesIndex > -1) {
            if (!seriesList[targetSeriesIndex].chapters) {
                seriesList[targetSeriesIndex].chapters = [];
            }
            
            // Eğer aynı bölüm id'si varsa listede güncelle, yoksa ekle
            const existChIndex = seriesList[targetSeriesIndex].chapters.findIndex(c => c.id === chapterId);
            const chapterMeta = {
                id: chapterId,
                title: title,
                is18: is18,
                date: new Date().toISOString().split('T')[0]
            };

            if (existChIndex > -1) {
                seriesList[targetSeriesIndex].chapters[existChIndex] = chapterMeta;
            } else {
                // Bölümleri genellikle baştan sona listelemek için sırayla ekleriz
                seriesList[targetSeriesIndex].chapters.push(chapterMeta);
            }

            await writeGithubFile("data/series.json", JSON.stringify(seriesList, null, 2), seriesFileData.sha, `${seriesId} serisine ${title} bölüm listesi eklendi`);
        }

        showStatus("globalMsg", `"${title}" başarıyla yüklendi ve seriye eklendi!`, "success");
        
        // Formları temizle
        document.getElementById("chapterTitle").value = "";
        document.getElementById("webtoonContent").value = "";
        document.getElementById("novelContent").value = "";
    } catch (err) {
        showStatus("globalMsg", "Bölüm yüklenirken hata oluştu: " + err.message, "error");
    }
}
