// assets/js/admin.js

// Global Değişkenler
let gitConfig = {};
let allSeries = [];
let editingSeriesId = null; // Seri düzenleme takibi
let editingChapterId = null; // Bölüm düzenleme takibi
let editingChapterSeriesId = null; // Düzenlenen bölümün ait olduğu seri

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
            showStatus("setupMsg", "Bağlantı başarısız! Bilgileri kontrol edin.", "error");
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

    if (tabName === "manage" || tabName === "chapters" || tabName === "manage-chapters") {
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

// ID (Slug) Üretici
function generateSlug(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/\-+/g, '-');
}

// --- GİTHUB API İLE DOSYA OKUMA, YAZMA VE SİLME SİSTEMİ ---

// Depodan Dosya Getir
async function getGithubFile(path) {
    const url = `https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}/contents/${path}?ref=${gitConfig.branch}&t=` + new Date().getTime();
    const response = await fetch(url, {
        headers: { "Authorization": `token ${gitConfig.token}` }
    });
    if (response.status === 404) {
        return { content: null, sha: null }; // Dosya yoksa
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

// Depodan Dosya Sil (Yeni Eklenen API Özelliği)
async function deleteGithubFile(path, sha, message = "Delete file via Admin Panel") {
    const url = `https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}/contents/${path}`;
    const body = {
        message: message,
        sha: sha,
        branch: gitConfig.branch
    };

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Authorization": `token ${gitConfig.token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Dosya silinemedi.");
    }
    return await response.json();
}

// Depodaki Bir Klasörün Tüm İçeriğini Rekürsif Sil (Yeni Eklenen Otomatik Temizlik)
async function deleteFolderContents(folderPath) {
    const url = `https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}/contents/${folderPath}?ref=${gitConfig.branch}&t=` + new Date().getTime();
    const response = await fetch(url, {
        headers: { "Authorization": `token ${gitConfig.token}` }
    });
    if (response.status === 404) return; // Klasör zaten yoksa es geç

    const files = await response.json();
    if (Array.isArray(files)) {
        for (const file of files) {
            if (file.type === "file") {
                await deleteGithubFile(file.path, file.sha, `Otomatik temizlik: ${file.name} silindi`);
            }
        }
    }
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
    // 1. Bölüm Ekleme ve Bölüm Yönetme sekmelerindeki aramaları yenile
    filterSeriesDropdown("chapterSeriesSearch", "chapterSeriesSelect");
    filterSeriesDropdown("manageChapterSeriesSearch", "manageChapterSeriesSelect");

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
                    <div class="actions">
                        <button class="btn-edit" onclick="editSeries('${s.id}')"><i class="fa-solid fa-pen-to-square"></i> Düzenle</button>
                        <button class="btn-del" onclick="deleteSeries('${s.id}')"><i class="fa-solid fa-trash"></i> Sil</button>
                    </div>
                </div>
            `;
        });
    }
}

// Hızlı Seri Arama Dropdown Filtresi
function filterSeriesDropdown(searchInputId, selectId) {
    const query = document.getElementById(searchInputId).value.trim().toLowerCase();
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Lütfen bir seri seçin...</option>';
    allSeries.forEach(s => {
        if (query === "" || s.title.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)) {
            select.innerHTML += `<option value="${s.id}">${s.title} (${s.type})</option>`;
        }
    });
}

// Seri Düzenleme Modunu Aç
function editSeries(id) {
    const series = allSeries.find(s => s.id === id);
    if (!series) return;

    editingSeriesId = id;

    document.getElementById("seriesTitle").value = series.title;
    document.getElementById("seriesSlug").value = series.id;
    document.getElementById("seriesAltTitle").value = series.altTitle || "";
    document.getElementById("seriesDescription").value = series.description;
    document.getElementById("seriesCover").value = series.cover;
    document.getElementById("seriesStatus").value = series.status;
    document.getElementById("seriesType").value = series.type;
    document.getElementById("seriesGenres").value = (series.genres || []).join(", ");
    document.getElementById("seriesScore").value = series.score;
    document.getElementById("seriesIs18").checked = series.is18 || false;

    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> "${series.title}" Serisini Düzenle`;
    document.getElementById("btnSubmitSeries").innerText = "Değişiklikleri Kaydet (Güncelle)";
    document.getElementById("btnCancelEdit").style.display = "block";
    document.getElementById("editModeBadge").style.display = "block";

    switchTab("series");
    document.getElementById("formTitle").scrollIntoView({ behavior: 'smooth' });
}

// Düzenlemeyi İptal Et
function cancelEdit() {
    editingSeriesId = null;

    document.getElementById("seriesTitle").value = "";
    document.getElementById("seriesSlug").value = "";
    document.getElementById("seriesAltTitle").value = "";
    document.getElementById("seriesDescription").value = "";
    document.getElementById("seriesCover").value = "";
    document.getElementById("seriesGenres").value = "";
    document.getElementById("seriesScore").value = "8.5";
    document.getElementById("seriesIs18").checked = false;

    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-book"></i> Yeni Seri Bilgileri`;
    document.getElementById("btnSubmitSeries").innerText = "Seriyi Depoya Commit Et";
    document.getElementById("btnCancelEdit").style.display = "none";
    document.getElementById("editModeBadge").style.display = "none";

    switchTab("manage");
}

// Yeni/Düzenle Seri Kaydet
async function submitSeries() {
    const title = document.getElementById("seriesTitle").value.trim();
    let slug = document.getElementById("seriesSlug").value.trim();
    const altTitle = document.getElementById("seriesAltTitle").value.trim();
    const description = document.getElementById("seriesDescription").value.trim();
    const cover = document.getElementById("seriesCover").value.trim();
    const status = document.getElementById("seriesStatus").value;
    const type = document.getElementById("seriesType").value;
    const genresInput = document.getElementById("seriesGenres").value;
    const score = document.getElementById("seriesScore").value;
    const is18 = document.getElementById("seriesIs18").checked;

    if (!title || !description || !cover) {
        showStatus("globalMsg", "Lütfen tüm zorunlu alanları doldurun!", "error");
        return;
    }

    if (!slug) {
        slug = generateSlug(title);
    } else {
        slug = generateSlug(slug);
    }
    
    const genres = genresInput.split(",").map(g => g.trim()).filter(g => g.length > 0);

    const targetSeries = {
        id: slug,
        title: title,
        altTitle: altTitle,
        description: description,
        cover: cover,
        status: status,
        type: type,
        genres: genres,
        score: score,
        is18: is18,
        chapters: []
    };

    try {
        const fileData = await getGithubFile("data/series.json");
        let list = fileData.content ? JSON.parse(fileData.content) : [];
        
        if (editingSeriesId) {
            const index = list.findIndex(s => s.id === editingSeriesId);
            if (index > -1) {
                targetSeries.chapters = list[index].chapters || [];
                list[index] = targetSeries;
            }
        } else {
            const existingIndex = list.findIndex(s => s.id === slug);
            if (existingIndex > -1) {
                if (!confirm("Bu isimde bir seri mevcut. Üzerine yazmak istiyor musunuz?")) return;
                targetSeries.chapters = list[existingIndex].chapters || [];
                list[existingIndex] = targetSeries;
            } else {
                list.push(targetSeries);
            }
        }

        await writeGithubFile("data/series.json", JSON.stringify(list, null, 2), fileData.sha, `${title} serisi kaydedildi`);
        showStatus("globalMsg", `"${title}" serisi başarıyla kaydedildi!`, "success");
        
        editingSeriesId = null;
        cancelEdit();
        fetchSeriesList();
    } catch (err) {
        showStatus("globalMsg", "Seri kaydedilirken hata: " + err.message, "error");
    }
}

// Seri Sil (Klasördeki tüm bölümleri de otomatik temizler!)
async function deleteSeries(id) {
    if (!confirm("Bu seriyi, ona bağlı tüm bölümleri ve deponuzdaki TÜM içerik dosyalarını kalıcı olarak silmek istediğinize emin misiniz?")) {
        return;
    }

    try {
        showStatus("globalMsg", "Depodaki bölüm dosyaları ve meta veriler otomatik siliniyor, lütfen bekleyin...", "success");

        // 1. Serinin "data/chapters/{id}/" altındaki tüm bölüm dosyalarını depodan temizle
        await deleteFolderContents(`data/chapters/${id}`);

        // 2. data/series.json dosyasından seriyi kaldır
        const fileData = await getGithubFile("data/series.json");
        let list = JSON.parse(fileData.content);
        list = list.filter(s => s.id !== id);

        await writeGithubFile("data/series.json", JSON.stringify(list, null, 2), fileData.sha, `${id} serisi ve klasörü tamamen silindi`);
        showStatus("globalMsg", "Seri ve tüm içerikleri başarıyla depodan silindi!", "success");
        fetchSeriesList();
    } catch (err) {
        showStatus("globalMsg", "Silme işlemi sırasında hata: " + err.message, "error");
    }
}

// --- BÖLÜM İŞLEMLERİ ---

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

function parseWebtoonImages(input) {
    const urls = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(input)) !== null) {
        urls.push(match[1]);
    }
    if (urls.length === 0) {
        return input.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    }
    return urls;
}

// Bölüm Kaydet (Yeni Ekleme veya Güncelleme)
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

    const chapterId = editingChapterId ? editingChapterId : generateSlug(title);
    let finalContent = "";

    if (contentType === "webtoon") {
        const rawContent = document.getElementById("webtoonContent").value;
        const parsedImages = parseWebtoonImages(rawContent);
        if (parsedImages.length === 0) {
            showStatus("globalMsg", "Lütfen resim linklerini girin!", "error");
            return;
        }
        finalContent = parsedImages;
    } else {
        const rawContent = document.getElementById("novelContent").value.trim();
        if (!rawContent) {
            showStatus("globalMsg", "Lütfen novel metnini girin!", "error");
            return;
        }
        finalContent = rawContent;
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
        showStatus("globalMsg", "Bölüm dosyası deponuza yazılıyor...", "success");

        // 1. Bölümün JSON dosyasını yaz/güncelle
        const path = `data/chapters/${seriesId}/${chapterId}.json`;
        const existingFile = await getGithubFile(path);
        await writeGithubFile(path, JSON.stringify(chapterPayload, null, 2), existingFile.sha, `${seriesId} - ${title} kaydedildi`);

        // 2. data/series.json dosyasındaki bölüm meta verisini güncelle
        const seriesFileData = await getGithubFile("data/series.json");
        let seriesList = JSON.parse(seriesFileData.content);
        const targetSeriesIndex = seriesList.findIndex(s => s.id === seriesId);

        if (targetSeriesIndex > -1) {
            if (!seriesList[targetSeriesIndex].chapters) {
                seriesList[targetSeriesIndex].chapters = [];
            }
            
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
                seriesList[targetSeriesIndex].chapters.push(chapterMeta);
            }

            await writeGithubFile("data/series.json", JSON.stringify(seriesList, null, 2), seriesFileData.sha, `${seriesId} serisine ${title} eklendi`);
        }

        showStatus("globalMsg", `"${title}" başarıyla kaydedildi!`, "success");
        cancelChapterEdit();
    } catch (err) {
        showStatus("globalMsg", "Bölüm kaydedilirken hata: " + err.message, "error");
    }
}

// --- YENİ EKLENEN BÖLÜMLERİ YÖNETME (DÜZENLE / SİL) FONKSİYONLARI ---

// Seçilen serinin bölümlerini yönetim dropdown listesine yükle
function loadChaptersForManagement(seriesId) {
    const area = document.getElementById("manageChaptersDropdownArea");
    const select = document.getElementById("manageChapterSelect");
    if (!seriesId) {
        area.style.display = "none";
        return;
    }

    const series = allSeries.find(s => s.id === seriesId);
    if (!series || !series.chapters || series.chapters.length === 0) {
        select.innerHTML = '<option value="">Bu seride hiç bölüm bulunmuyor.</option>';
        area.style.display = "block";
        return;
    }

    select.innerHTML = '<option value="">Düzenlemek veya silmek istediğiniz bölümü seçin...</option>';
    series.chapters.forEach(ch => {
        select.innerHTML += `<option value="${ch.id}">${ch.title}</option>`;
    });
    area.style.display = "block";
}

// Bölüm Düzenleme Modunu Başlat
async function startEditChapter() {
    const seriesId = document.getElementById("manageChapterSeriesSelect").value;
    const chapterId = document.getElementById("manageChapterSelect").value;

    if (!seriesId || !chapterId) {
        alert("Lütfen önce bir seri ve bir bölüm seçin.");
        return;
    }

    try {
        showStatus("globalMsg", "Bölüm içeriği depodan çekiliyor, lütfen bekleyin...", "success");
        const fileData = await getGithubFile(`data/chapters/${seriesId}/${chapterId}.json`);
        
        if (!fileData.content) {
            throw new Error("Bölüm dosyası depoda bulunamadı.");
        }

        const chData = JSON.parse(fileData.content);

        editingChapterId = chapterId;
        editingChapterSeriesId = seriesId;

        // Bölüm ekleme formunu doldur
        document.getElementById("chapterSeriesSelect").value = seriesId;
        document.getElementById("chapterTitle").value = chData.title;
        document.getElementById("chapterIs18").checked = chData.is18 || false;
        document.getElementById("chapterContentType").value = chData.type;
        toggleContentInputs();

        if (chData.type === "webtoon") {
            // Dizi olarak gelen resim linklerini tekrar alt alta text haline getiriyoruz
            document.getElementById("webtoonContent").value = chData.content.join("\n");
        } else {
            document.getElementById("novelContent").value = chData.content;
        }

        // Arayüzü Düzenleme Moduna Çek
        document.getElementById("chapterFormTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Bölümü Düzenle: ${chData.title}`;
        document.getElementById("btnSubmitChapter").innerText = "Değişiklikleri Kaydet (Bölümü Güncelle)";
        document.getElementById("btnCancelChapterEdit").style.display = "block";
        document.getElementById("chEditModeBadge").style.display = "block";

        // Tabı değiştirerek formu göster
        switchTab("chapters");
    } catch (err) {
        showStatus("globalMsg", "Bölüm içeriği yüklenemedi: " + err.message, "error");
    }
}

// Bölüm Düzenlemeyi İptal Et
function cancelChapterEdit() {
    editingChapterId = null;
    editingChapterSeriesId = null;

    document.getElementById("chapterTitle").value = "";
    document.getElementById("chapterIs18").checked = false;
    document.getElementById("webtoonContent").value = "";
    document.getElementById("novelContent").value = "";

    document.getElementById("chapterFormTitle").innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Bölüm Bilgileri`;
    document.getElementById("btnSubmitChapter").innerText = "Bölümü Depoya Commit Et";
    document.getElementById("btnCancelChapterEdit").style.display = "none";
    document.getElementById("chEditModeBadge").style.display = "none";

    switchTab("manage-chapters");
    document.getElementById("manageChaptersDropdownArea").style.display = "none";
    document.getElementById("manageChapterSeriesSelect").value = "";
    document.getElementById("manageChapterSeriesSearch").value = "";
}

// Bölümü Tamamen Sil (Hem depodan hem de data/series.json listesinden!)
async function deleteChapter() {
    const seriesId = document.getElementById("manageChapterSeriesSelect").value;
    const chapterId = document.getElementById("manageChapterSelect").value;

    if (!seriesId || !chapterId) {
        alert("Lütfen önce bir seri ve silmek istediğiniz bölümü seçin.");
        return;
    }

    if (!confirm("Bu bölümü ve depodaki tüm ham içerik dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
        return;
    }

    try {
        showStatus("globalMsg", "Bölüm dosyaları depodan siliniyor, lütfen bekleyin...", "success");

        // 1. data/chapters/{seriesId}/{chapterId}.json dosyasının SHA'sını al ve sil
        const path = `data/chapters/${seriesId}/${chapterId}.json`;
        const fileData = await getGithubFile(path);
        if (fileData.sha) {
            await deleteGithubFile(path, fileData.sha, `${seriesId} - ${chapterId} bölüm dosyası silindi`);
        }

        // 2. data/series.json dosyasından bölüm meta verisini kaldır
        const seriesFileData = await getGithubFile("data/series.json");
        let list = JSON.parse(seriesFileData.content);
        const sIndex = list.findIndex(s => s.id === seriesId);

        if (sIndex > -1 && list[sIndex].chapters) {
            list[sIndex].chapters = list[sIndex].chapters.filter(ch => ch.id !== chapterId);
            await writeGithubFile("data/series.json", JSON.stringify(list, null, 2), seriesFileData.sha, `${seriesId} serisinden ${chapterId} bölümü silindi`);
        }

        showStatus("globalMsg", "Bölüm başarıyla silindi ve temizlendi!", "success");
        
        // UI güncelle
        document.getElementById("manageChaptersDropdownArea").style.display = "none";
        document.getElementById("manageChapterSeriesSelect").value = "";
        document.getElementById("manageChapterSeriesSearch").value = "";
        fetchSeriesList();
    } catch (err) {
        showStatus("globalMsg", "Bölüm silinirken hata: " + err.message, "error");
    }
}
