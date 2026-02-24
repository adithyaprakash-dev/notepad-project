if ("Notification" in window) {
    Notification.requestPermission();
}
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editingIndex = null;
// AUTO SAVE WHILE TYPING
document.addEventListener("DOMContentLoaded", () => {
    displayNotes();
    displayArchivedNotes();
    if (typeof populateCategoryFilter === "function") {
    populateCategoryFilter();
}
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

<div class="note-menu">
  <button class="menu-btn" onclick="toggleMenu(this)">⋮</button>
<div class="menu-dropdown">
        <button onclick="togglePin(${note.originalIndex})">
            ${note.pinned ? "📌 Unpin" : "📍 Pin"}
        </button>
        <button onclick="editNote(${note.originalIndex})">✏️ Edit</button>
        <button onclick="toggleArchive(${note.originalIndex})">📦 Archive</button>
        <button onclick="deleteNote(${note.originalIndex})">🗑 Delete</button>
    </div>
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
let deleteIndex = null;

function deleteNote(index) {
    deleteIndex = index;
    document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

function confirmDelete() {
    if (deleteIndex === null) return;

    notes.splice(deleteIndex, 1);
    localStorage.setItem("notes", JSON.stringify(notes));

    closeDeleteModal();
    displayNotes();
    displayArchivedNotes();
    showToast("Note deleted");
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
<div class="note-menu">
   <button class="menu-btn" onclick="toggleMenu(this)">⋮</button>

    <div class="menu-dropdown">
        <button onclick="togglePin(${note.originalIndex})">
            ${note.pinned ? "📌 Unpin" : "📍 Pin"}
        </button>
        <button onclick="editNote(${note.originalIndex})">✏️ Edit</button>
        <button onclick="toggleArchive(${note.originalIndex})">📦 Archive</button>
        <button onclick="deleteNote(${note.originalIndex})">🗑 Delete</button>
    </div>
</div>

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
    const name = file.name.toLowerCase();

    reader.onload = function(e) {

        // ===== JSON IMPORT =====
        if (name.endsWith(".json")) {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    showToast("JSON must contain note list", "error");
                    return;
                }

                const cleaned = imported.map(n => ({
                    text: n.text || "Untitled note",
                    date: n.date || new Date().toLocaleString(),
                    timestamp: n.timestamp || Date.now(),
                    pinned: n.pinned || false,
                    archived: n.archived || false,
                    category: n.category || "",
                    color: n.color || "",
                    reminderDate: n.reminderDate || "",
                    reminderTime: n.reminderTime || "",
                    reminded: false,
                    checklist: n.checklist || []
                }));

                notes = [...notes, ...cleaned];
                showToast("JSON notes imported");

            } catch {
                showToast("Invalid JSON file", "error");
                return;
            }
        }

        // ===== TXT IMPORT =====
        else if (name.endsWith(".txt")) {

            const lines = e.target.result.split("\n").filter(l => l.trim());

            lines.forEach(line => {
                notes.push({
                    text: line.trim(),
                    date: new Date().toLocaleString(),
                    timestamp: Date.now(),
                    pinned: false,
                    archived: false,
                    category: "",
                    color: "",
                    reminderDate: "",
                    reminderTime: "",
                    reminded: false,
                    checklist: []
                });
            });

            showToast("Text notes imported");
        }

        // ===== CSV IMPORT =====
        else if (name.endsWith(".csv")) {

            const rows = e.target.result.split("\n");

            rows.forEach(row => {
                const text = row.split(",")[0];
                if (!text) return;

                notes.push({
                    text: text.trim(),
                    date: new Date().toLocaleString(),
                    timestamp: Date.now(),
                    pinned: false,
                    archived: false,
                    category: "",
                    color: "",
                    reminderDate: "",
                    reminderTime: "",
                    reminded: false,
                    checklist: []
                });
            });

            showToast("CSV notes imported");
        }

        // ===== OTHER FILES =====
        else {
            showToast("Only JSON, TXT, CSV supported", "error");
            return;
        }

        localStorage.setItem("notes", JSON.stringify(notes));
        displayNotes();
        displayArchivedNotes();
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

        <div class="note-menu">
            <button class="menu-btn" onclick="toggleMenu(this)">⋮</button>

            <div class="menu-dropdown">
                <button onclick="toggleArchive(${note.originalIndex})">📤 Restore</button>
                <button onclick="deleteNote(${note.originalIndex})">🗑 Delete</button>
            </div>
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
document.addEventListener("click", function (e) {

    const btn = e.target.closest(".menu-btn");

    if (btn) {
        const menu = btn.nextElementSibling;

        document.querySelectorAll(".menu-dropdown")
            .forEach(m => {
                if (m !== menu) m.classList.remove("show");
            });

        menu.classList.toggle("show");
        return;
    }

    document.querySelectorAll(".menu-dropdown")
        .forEach(m => m.classList.remove("show"));
});
// EXPORT SELECTED NOTES AS PDF
function exportPDF() {

    const selected = document.querySelectorAll(".note-select:checked");

    if (selected.length === 0) {
        showToast("Select notes first", "error");
        return;
    }

    if (!window.jspdf) {
        showToast("PDF library missing", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 22;

    // ===== HEADER TITLE =====
    doc.setFont("helvetica","bold");
    doc.setFontSize(20);

    const customTitle = document.getElementById("pdfTitle")?.value.trim();
    doc.text(customTitle || "My Notes", 105, y, { align: "center" });

    y += 8;

    // ===== DIVIDER LINE (clean app look) =====
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);

    y += 12;

    // ===== LOOP THROUGH NOTES =====
    selected.forEach((cb) => {

        const index = parseInt(cb.getAttribute("data-index"));
        const note = notes[index];
        if (!note) return;

        // Remove emojis to avoid PDF font crash
        const safeText = note.text.replace(/[^\x00-\x7F]/g, "");

        const lines = doc.splitTextToSize(safeText, 175);

        // Dynamic card height
        const cardHeight = lines.length * 6 + 22;

        // New page if needed
        if (y + cardHeight > 280) {
            doc.addPage();
            y = 22;
        }

        // Convert HEX to RGB
        function hexToRgb(hex) {
            hex = (hex || "#f5f5f5").replace("#", "");
            const bigint = parseInt(hex, 16);
            return [
                (bigint >> 16) & 255,
                (bigint >> 8) & 255,
                bigint & 255
            ];
        }

        const [r,g,b] = hexToRgb(note.color);

        // ===== CARD BACKGROUND =====
        doc.setFillColor(r,g,b);
        doc.roundedRect(12, y, 186, cardHeight, 5, 5, "F");

        // ===== CATEGORY =====
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(note.category || "Note", 18, y+10);

        // ===== NOTE TEXT =====
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.setTextColor(20);
        doc.text(lines, 18, y+18);

        // ===== DATE =====
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(note.date, 18, y + cardHeight - 5);

        y += cardHeight + 12;
    });

    doc.save("My_Notes.pdf");
    showToast("Professional PDF exported");
}
// ===== ENABLE EXPORT BUTTON WHEN NOTES SELECTED =====
document.addEventListener("change", function(e){

    if(!e.target.classList.contains("note-select")) return;

    const checked = document.querySelectorAll(".note-select:checked").length;
    const btn = document.getElementById("exportBtn");
    const label = document.getElementById("selectionCount");

    if(label){
        label.textContent = checked === 0
            ? "No notes selected"
            : checked + " selected";
    }

    if(btn){
        btn.disabled = checked === 0;
    }
});