// Load notes from storage
let notes = JSON.parse(localStorage.getItem("notes")) || [];

// Save new note (used in index.html)
function saveNote() {
    let input = document.getElementById("noteInput");
    if (!input) return;

    let text = input.value.trim();
    if (text === "") return alert("Write something!");

    notes.push({
        text: text,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("notes", JSON.stringify(notes));
    input.value = "";

    alert("Note saved!");
}

// Show notes list (used in saved.html)
window.onload = function () {
    let list = document.getElementById("notesList");
    if (!list) return;

    list.innerHTML = "";

    notes.forEach((note, index) => {
        let li = document.createElement("li");
        li.innerHTML = `
            <div>
                <strong>${note.text}</strong><br>
                <small>${note.date}</small>
            </div>
            <button onclick="deleteNote(${index})">Delete</button>
        `;
        list.appendChild(li);
    });
};

// Delete note
function deleteNote(index) {
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    location.reload();
}