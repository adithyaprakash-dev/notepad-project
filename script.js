if ("Notification" in window) {
    Notification.requestPermission();
}
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editingIndex = null;
// AUTO SAVE WHILE TYPING
document.addEventListener("DOMContentLoaded", () => {
    displayNotes();
    displayArchivedNotes();
    populateCategoryFilter?.();

    // Dark mode restore
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
    }

    // Archive section restore
    const archiveOpen = localStorage.getItem("archiveOpen") === "true";
    setArchiveVisible?.(archiveOpen);

    // 🔧 LOAD NOTE FOR EDITING
    const editIndex = localStorage.getItem("editIndex");
    if (editIndex !== null) {
        const note = notes[editIndex];
        if (note) {
            document.getElementById("noteInput").value = note.text;

            const categoryInput = document.getElementById("categoryInput");
            if (categoryInput) categoryInput.value = note.category || "";

            const colorInput = document.getElementById("colorInput");
            if (colorInput) colorInput.value = note.color || "";
        }
    }
    checkReminders(); // run immediately when page loads
});
// SAVE NOTE
function saveNote() {
    const input = document.getElementById("noteInput");
    const categoryInput = document.getElementById("categoryInput");
    const colorInput = document.getElementById("colorInput");

    // 👉 NEW reminder inputs
    const reminderDateInput = document.getElementById("reminderDate");
    const reminderTimeInput = document.getElementById("reminderTime");

    if (!input) return;

    const text = input.value.trim();
    if (!text) {
        showToast("Write something first", "error");
        return;
    }

    const category = categoryInput ? categoryInput.value.trim() : "";
    const color = colorInput ? colorInput.value : "";

    // 👉 NEW reminder values
    const reminderDate = reminderDateInput ? reminderDateInput.value : "";
    const reminderTime = reminderTimeInput ? reminderTimeInput.value : "";

    const editIndex = localStorage.getItem("editIndex");

    if (editIndex !== null) {
        // ✏️ UPDATE EXISTING NOTE
        notes[editIndex] = {
            ...notes[editIndex],
            text,
            category,
            color,
            reminderDate,
            reminderTime
        };
        localStorage.removeItem("editIndex");
        showToast("Note updated");
    } else {
        // 🆕 CREATE NEW NOTE
        const note = {
    text,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
    pinned: false,
    archived: false,
    category,
    color,
    reminderDate,
    reminderTime,
    reminded: false,
    checklist: []   // ⭐ NEW FIELD
};
        notes.push(note);
        showToast("Note saved");
    }

    localStorage.setItem("notes", JSON.stringify(notes));

    // clear fields
    input.value = "";
    if (categoryInput) categoryInput.value = "";
    if (colorInput) colorInput.value = "";
    if (reminderDateInput) reminderDateInput.value = "";
    if (reminderTimeInput) reminderTimeInput.value = "";

    displayNotes?.();
}
// DISPLAY NOTES
 function displayNotes() {
    const list = document.getElementById("notesList");
    if (!list) return;

    list.innerHTML = "";

    if (notes.length === 0) {
        list.innerHTML = "<p style='text-align:center'>No notes yet</p>";
        return;
    }

    // Create array with original index
    const sortType = document.getElementById("sortSelect")?.value || "new";

let notesWithIndex = notes
    .map((note, index) => ({ ...note, originalIndex: index }))
    .filter(note => !note.archived);

// ===== SORTING (PRO VERSION) =====

notesWithIndex.sort((a, b) => {

    // Always keep pinned notes on top
    if (a.pinned !== b.pinned) {
        return b.pinned - a.pinned;
    }

    // Apply dropdown sort inside pinned/unpinned groups
    if (sortType === "new") {
    return (b.timestamp || 0) - (a.timestamp || 0);
}

if (sortType === "old") {
    return (a.timestamp || 0) - (b.timestamp || 0);
}

    if (sortType === "category") {
        return (a.category || "").localeCompare(b.category || "");
    }

    return 0;
});
    // Sort pinned first
   

   notesWithIndex.forEach(note => {
    const card = document.createElement("div");
    card.className = note.pinned ? "note-card pinned" : "note-card";

    // APPLY COLOR HERE
    if (note.color) {
        card.style.background = note.color;
    }
        card.innerHTML = `
    <div class="note-body">
        ${note.pinned ? `<span class="pin-badge">📌 Pinned</span>` : ""}
        ${note.category ? `<span class="note-tag">${note.category}</span>` : ""}
        <input type="checkbox" class="note-select" data-index="${note.originalIndex}">
        <p class="note-text">${note.text}</p>
<small class="note-date">${note.date}</small>

${note.reminderDate ? `
    <p class="reminder">
        ⏰ ${note.reminderDate} ${note.reminderTime || ""}
    </p>
` : ""}
    </div>

    <div class="note-actions">
        <button onclick="togglePin(${note.originalIndex})">
            ${note.pinned ? "📌 Unpin" : "📍 Pin"}
        </button>
        <button onclick="editNote(${note.originalIndex})">Edit</button>
        <button onclick="toggleArchive(${note.originalIndex})">Archive</button>
        <button onclick="deleteNote(${note.originalIndex})">Delete</button>
    </div>
`;

        list.appendChild(card);
    });
}
// EDIT NOTE

    function editNote(index) {
    localStorage.setItem("editIndex", index);
    window.location.href = "index.html";
}


// DELETE NOTE WITH CONFIRM
function deleteNote(index) {
    if (!confirm("Delete this note?")) return;

    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes();
}
// SEARCH NOTES
function searchNotes() {
    const searchText = document.getElementById("searchBox").value.toLowerCase();
    const list = document.getElementById("notesList");
    if (!list) return;

    list.innerHTML = "";

    const filtered = notes
        .map((note, index) => ({ ...note, originalIndex: index }))
        .filter(note =>
            note.text.toLowerCase().includes(searchText) ||
            (note.category && note.category.toLowerCase().includes(searchText))
        );

    if (filtered.length === 0) {
        list.innerHTML = "<p style='text-align:center'>No matching notes</p>";
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement("div");
        card.className = note.pinned ? "note-card pinned" : "note-card";

        card.innerHTML = `
            <div class="note-body">
                ${note.category ? `<span class="note-tag">${note.category}</span>` : ""}
                <p class="note-text">${note.text}</p>
                <small class="note-date">${note.date}</small>
            </div>

            <div class="note-actions">
                <button onclick="togglePin(${note.originalIndex})">
                    ${note.pinned ? "📌 Unpin" : "📍 Pin"}
                </button>
                <button onclick="editNote(${note.originalIndex})">Edit</button>
                <button onclick="deleteNote(${note.originalIndex})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

// TOGGLE DARK MODE
function toggleDarkMode() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );
}

// load note for editing
const editIndex = localStorage.getItem("editIndex");
const input = document.getElementById("noteInput");

if (editIndex !== null && input) {
    const notesArr = JSON.parse(localStorage.getItem("notes")) || [];
    if (notesArr[editIndex]) {
        input.value = notesArr[editIndex].text;
        editingIndex = Number(editIndex);
    }
}
;
//toggle pin
function togglePin(index) {
    notes[index].pinned = !notes[index].pinned;
    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes();
}
// EXPORT NOTES AS JSON
function exportNotes() {
    const checkboxes = document.querySelectorAll(".note-select:checked");

    if (checkboxes.length === 0) {
       showToast("Select at least one note to export", "error");
        return;
    }

    const selectedNotes = [];

    checkboxes.forEach(cb => {
        const index = cb.getAttribute("data-index");
        selectedNotes.push(notes[index]);
    });

    const dataStr = JSON.stringify(selectedNotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "selected-notes.json";
    a.click();

    URL.revokeObjectURL(url);
}
// TOAST NOTIFICATION
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = "show " + type;

    setTimeout(() => {
        toast.className = "";
    }, 2500);
}
// IMPORT NOTES FROM JSON
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            if (!Array.isArray(imported)) {
                showToast("Invalid file format", "error");
                return;
            }

            // normalize imported notes
            const cleaned = imported.map(n => ({
                text: n.text || "",
                date: n.date || new Date().toLocaleString(),
                pinned: n.pinned || false,
                category: n.category || ""
            }));

            notes = [...notes, ...cleaned];
            localStorage.setItem("notes", JSON.stringify(notes));

            showToast("Notes imported successfully");
            displayNotes();
            populateCategoryFilter();

        } catch (err) {
            console.error(err);
            showToast("Invalid or corrupted file", "error");
        }
    };

    reader.readAsText(file);
}
function toggleArchiveSection() {
    const section = document.getElementById("archivedList");
    if (!section) return;

    section.style.display =
        section.style.display === "none" ? "grid" : "none";
}
// TOGGLE ARCHIVE
function toggleArchive(index) {
    if (!notes[index]) return;

    notes[index].archived = !notes[index].archived;
    localStorage.setItem("notes", JSON.stringify(notes));

    // redraw both sections
    displayNotes();
    displayArchivedNotes();
}
// displayArchivedNotes
function displayArchivedNotes() {
    const list = document.getElementById("archivedList");
    if (!list) return;

    list.innerHTML = "";

    const archived = notes
        .map((note, index) => ({ ...note, originalIndex: index }))
        .filter(note => note.archived);

    // update counter
    const count = document.getElementById("archiveCount");
    if (count) count.textContent = archived.length;

    archived.forEach(note => {
       const card = document.createElement("div");
    card.className = "note-card";

if (note.color) {
    card.style.background = note.color;
}
        card.innerHTML = `
            <div class="note-body">
                ${note.category ? `<span class="note-tag">${note.category}</span>` : ""}
                <p class="note-text">${note.text}</p>
                <small>${note.date}</small>
            </div>

            <div class="note-actions">
                <button onclick="toggleArchive(${note.originalIndex})">Restore</button>
                <button onclick="deleteNote(${note.originalIndex})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

function setArchiveVisible(isOpen) {
    localStorage.setItem("archiveOpen", isOpen ? "true" : "false");

    const section = document.getElementById("archivedList");
    if (!section) return;

    section.style.display = isOpen ? "grid" : "none";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
setInterval(checkReminders, 30000); // check every 30 seconds
// CHECK REMINDERS AND SHOW NOTIFICATIONS
function checkReminders() {
    const now = new Date();

    notes.forEach(note => {

        if (!note.reminderDate || note.reminded) return;

        const reminderTime = note.reminderTime || "00:00";
        const reminder = new Date(`${note.reminderDate} ${reminderTime}`);

        if (now >= reminder) {

            if (Notification.permission === "granted") {
                new Notification("📝 Reminder", {
                    body: note.text.substring(0, 80)
                });
            }

            note.reminded = true;
            localStorage.setItem("notes", JSON.stringify(notes));
        }
    });
}