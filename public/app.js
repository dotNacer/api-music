document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', async (e) => {
        e.preventDefault()
        const sectionId = e.target.dataset.section

        document.querySelectorAll('.section').forEach((section) => {
            section.classList.add('hidden')
        })

        const selectedSection = document.getElementById(sectionId)
        selectedSection.classList.remove('hidden')

        switch (sectionId) {
            case 'beats':
                await loadBeats()
                await loadCategories()
                await loadLyrics()
                break
            case 'covers':
                await loadCovers()
                break
            case 'projects':
                await loadProjects()
                await loadBeats()
                await loadCovers()
                break
            case 'categories':
                await loadCategories()
                break
            case 'lyrics':
                await loadLyrics()
                break
        }
    })
})

// Fonctions API
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`/api/${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
        },
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
}

// Gestionnaire de beats
const beatUploadForm = document.getElementById('beatUploadForm')
beatUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(beatUploadForm)
    try {
        await fetchAPI('beats', {
            method: 'POST',
            body: formData,
        })
        await loadBeats()
        await loadProjects()
        beatUploadForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})

const youtubeForm = document.getElementById('youtubeForm')
youtubeForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(youtubeForm)
    try {
        await fetchAPI('beats/youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: formData.get('url'),
                categorie_id: formData.get('categorie_id'),
                lyrics_id: formData.get('lyrics_id') || null,
            }),
        })
        loadBeats()
        youtubeForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})

async function loadBeats() {
    try {
        const beats = await fetchAPI('beats')
        const beatsList = document.getElementById('beatsList')
        beatsList.innerHTML = beats
            .map(
                (beat) => `
            <div class="item-card">
                <div class="item-info">
                    <strong>Beat ${beat.id}</strong>
                    ${beat.bpm ? `<span>BPM: ${beat.bpm}</span>` : ''}
                    ${beat.key ? `<span>Key: ${beat.key}</span>` : ''}
                </div>
                <div class="item-actions">
                    <button onclick="deleteBeat(${beat.id})">Supprimer</button>
                    <button onclick="downloadBeat(${
                        beat.id
                    })">Télécharger</button>
                </div>
            </div>
        `
            )
            .join('')
    } catch (error) {
        console.error('Erreur chargement beats:', error)
    }
}

// Fonction utilitaire pour extraire le nom du fichier d'un chemin
function getFileName(filePath) {
    return filePath.split('/').pop()
}

// Gestionnaire de covers
const coverUploadForm = document.getElementById('coverUploadForm')
coverUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(coverUploadForm)
    try {
        await fetchAPI('covers', {
            method: 'POST',
            body: formData,
        })
        await loadCovers()
        await loadProjects() // Recharger les projets car ils utilisent les covers
        coverUploadForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})
async function loadCovers() {
    try {
        const covers = await fetchAPI('covers')
        const coversList = document.getElementById('coversList')
        coversList.innerHTML = covers
            .map(
                (cover) => `
            <div class="item-card">
                <div class="item-info">
                    <strong>${cover.title}</strong>
                    <img src="${cover.imageUrl}" alt="${cover.title}" class="cover-image"/>
                </div>
                <div class="item-actions">
                    <button onclick="deleteCover(${cover.id})">Supprimer</button>
                </div>
            </div>
        `
            )
            .join('')
    } catch (error) {
        console.error('Erreur chargement covers:', error)
    }
}
// Gestionnaire de projets
async function loadProjects() {
    try {
        // Charger les beats et covers pour les menus déroulants
        const beats = await fetchAPI('beats')
        const covers = await fetchAPI('covers')

        // Mettre à jour les options des menus déroulants
        const beatSelect = document.querySelector('select[name="beat_id"]')
        const coverSelect = document.querySelector('select[name="cover_id"]')

        // Remplir le menu déroulant des beats
        beatSelect.innerHTML = `
            <option value="">Sélectionner un beat</option>
            ${beats
                .map(
                    (beat) => `
                <option value="${beat.id}">Beat ${beat.id}</option>
            `
                )
                .join('')}
        `

        // Remplir le menu déroulant des covers
        coverSelect.innerHTML = `
            <option value="">Sélectionner une cover</option>
            ${covers
                .map(
                    (cover) => `
                <option value="${cover.id}">${cover.title}</option>
            `
                )
                .join('')}
        `

        // Charger la liste des projets
        const projects = await fetchAPI('projects')
        const projectsList = document.getElementById('projectsList')
        projectsList.innerHTML = projects
            .map(
                (project) => `
            <div class="item-card">
                <div class="item-info">
                    <strong>Projet ${project.id}</strong>
                    <span>Beat: ${project.beat_path}</span>
                    <span>Cover: ${project.cover_title}</span>
                </div>
                <div class="item-actions">
                    <button onclick="deleteProject(${project.id})">Supprimer</button>
                </div>
            </div>
        `
            )
            .join('')
    } catch (error) {
        console.error('Erreur chargement projets:', error)
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadBeats()
    loadCovers()
    loadProjects()
    loadCategories()
    loadLyrics()
})

async function deleteBeat(id) {
    if (
        confirm(
            'Êtes-vous sûr de vouloir supprimer ce beat et tous les projets associés ?'
        )
    ) {
        try {
            await fetchAPI(`beats/${id}`, { method: 'DELETE' })
            await loadBeats()
            await loadProjects()
        } catch (error) {
            alert(`Erreur de suppression: ${error.message}`)
        }
    }
}

async function deleteCover(id) {
    if (
        confirm(
            'Êtes-vous sûr de vouloir supprimer cette cover et tous les projets associés ?'
        )
    ) {
        try {
            await fetchAPI(`covers/${id}`, { method: 'DELETE' })
            await loadCovers()
            await loadProjects()
        } catch (error) {
            alert(`Erreur de suppression: ${error.message}`)
        }
    }
}

async function deleteProject(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        try {
            await fetchAPI(`projects/${id}`, { method: 'DELETE' })
            await loadProjects()
        } catch (error) {
            alert(`Erreur de suppression: ${error.message}`)
        }
    }
}

// Ajouter cette nouvelle fonction pour le téléchargement
async function downloadBeat(id) {
    try {
        const response = await fetch(`/download/beats/${id}`)
        if (!response.ok) throw new Error('Erreur lors du téléchargement')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `beat-${id}.mp3`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    } catch (error) {
        console.error('Erreur de téléchargement:', error)
        alert('Erreur lors du téléchargement du beat')
    }
}

// Ajouter la gestion du formulaire de projet
const projectForm = document.getElementById('projectForm')
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(projectForm)
    try {
        await fetchAPI('projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                beat_id: parseInt(formData.get('beat_id')),
                cover_id: parseInt(formData.get('cover_id')),
            }),
        })
        loadProjects()
        projectForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})

// Modifier le gestionnaire de formulaire de catégorie
const categoryForm = document.getElementById('categoryForm')
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(categoryForm)
    try {
        await fetchAPI('categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.get('name'),
            }),
        })
        const categories = await loadCategories()
        updateCategoryDropdowns(categories)
        categoryForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})

async function loadCategories() {
    try {
        const categories = await fetchAPI('categories')
        const categoriesList = document.getElementById('categoriesList')
        categoriesList.innerHTML = categories
            .map(
                (category) => `
            <div class="item-card">
                <div class="item-info">
                    <strong>${category.name}</strong>
                </div>
                <div class="item-actions">
                    <button onclick="deleteCategory(${category.id})">Supprimer</button>
                </div>
            </div>
        `
            )
            .join('')

        updateCategoryDropdowns(categories)
        return categories
    } catch (error) {
        console.error('Erreur chargement catégories:', error)
        return []
    }
}

async function deleteCategory(id) {
    if (
        confirm(
            'Êtes-vous sûr de vouloir supprimer cette catégorie et tous ses éléments associés ?'
        )
    ) {
        try {
            await fetchAPI(`categories/${id}`, { method: 'DELETE' })
            await loadCategories()
            await loadBeats()
            await loadProjects()
        } catch (error) {
            alert(`Erreur de suppression: ${error.message}`)
        }
    }
}

function updateCategoryDropdowns(categories) {
    const categorySelects = document.querySelectorAll(
        'select[name="categorie_id"]'
    )
    categorySelects.forEach((select) => {
        const currentValue = select.value // Sauvegarder la valeur actuelle
        select.innerHTML = `
            <option value="">Sélectionner une catégorie</option>
            ${categories
                .map(
                    (cat) => `
                <option value="${cat.id}">${cat.name}</option>
            `
                )
                .join('')}
        `
        select.value = currentValue // Restaurer la valeur si elle existe toujours
    })
}

const lyricsForm = document.getElementById('lyricsForm')
lyricsForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(lyricsForm)
    try {
        await fetchAPI('lyrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: formData.get('title'),
                lyrics: formData.get('lyrics'),
            }),
        })
        await loadLyrics()
        await loadBeats()
        lyricsForm.reset()
    } catch (error) {
        alert(`Erreur: ${error.message}`)
    }
})

async function loadLyrics() {
    try {
        const lyrics = await fetchAPI('lyrics')
        const lyricsList = document.getElementById('lyricsList')
        lyricsList.innerHTML = lyrics
            .map(
                (lyric) => `
            <div class="item-card">
                <div class="item-info">
                    <strong>${lyric.title}</strong>
                    <pre class="lyrics-content">${lyric.lyrics}</pre>
                </div>
                <div class="item-actions">
                    <button onclick="deleteLyrics(${lyric.id})">Supprimer</button>
                </div>
            </div>
        `
            )
            .join('')

        updateLyricsDropdowns(lyrics)
        return lyrics
    } catch (error) {
        console.error('Erreur chargement paroles:', error)
        return []
    }
}

async function deleteLyrics(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces paroles ?')) {
        try {
            await fetchAPI(`lyrics/${id}`, { method: 'DELETE' })
            await loadLyrics()
            await loadBeats()
        } catch (error) {
            alert(`Erreur de suppression: ${error.message}`)
        }
    }
}

function updateLyricsDropdowns(lyrics) {
    const lyricsSelects = document.querySelectorAll('select[name="lyrics_id"]')
    lyricsSelects.forEach((select) => {
        const currentValue = select.value
        select.innerHTML = `
            <option value="">Sélectionner des paroles (optionnel)</option>
            ${lyrics
                .map(
                    (lyric) => `
                <option value="${lyric.id}">${lyric.title}</option>
            `
                )
                .join('')}
        `
        select.value = currentValue
    })
}
