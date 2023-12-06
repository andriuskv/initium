import { dispatchCustomEvent, getRandomValueBetweenTwoNumbers } from "utils";
import { useNotes } from "contexts/stickyNotes";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import CreateButton from "components/CreateButton";
import "./sticky-notes.css";

export default function StickyNotes({ locale, hide }) {
  const { notes, removeNote } = useNotes();

  function createNote() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const noteSize = 222;
    const minY = 16;
    const freeCenterHeight = height * 0.42;
    const centerWidth = 588;
    const sideWidth = (width - centerWidth) / 2;
    const zones = [
      {
        minX: noteSize / 2,
        minY,
        maxX: sideWidth - noteSize / 2,
        maxY: height - noteSize
      },
      {
        minX: sideWidth,
        minY,
        maxX: sideWidth + centerWidth,
        maxY: freeCenterHeight - noteSize
      },
      {
        minX: sideWidth + centerWidth + noteSize / 2,
        minY,
        maxX: width - noteSize / 2,
        maxY: height - noteSize
      }
    ];
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    const x = getRandomValueBetweenTwoNumbers(randomZone.minX, randomZone.maxX) / width * 100;
    const y = getRandomValueBetweenTwoNumbers(randomZone.minY, randomZone.maxY) / height * 100;

    dispatchCustomEvent("sticky-note", { action: "create", x, y });
    hide();
  }

  function editNote(id) {
    dispatchCustomEvent("sticky-note", { action: "edit", id });
    hide();
  }

  return (
    <div className="sticky-notes-list-container">
      {notes.length ? (
        <ul className="sticky-notes-list" data-dropdown-parent>
          {notes.toReversed().map(note => (
            <li className="sticky-notes-list-item" style={{ backgroundColor: note.backgroundColor, "--text-color": note.textStyle.string }} key={note.id}>
              <Dropdown>
                <button className="btn icon-text-btn dropdown-btn" onClick={() => editNote(note.id)}>
                  <Icon id="edit"/>
                  <span>{locale.global.edit}</span>
                </button>
                <button className="btn icon-text-btn dropdown-btn" onClick={() => removeNote(note.id)}>
                  <Icon id="trash"/>
                  <span>{locale.global.remove}</span>
                </button>
              </Dropdown>
              {note.title ? <p className="sticky-notes-list-item-content sticky-notes-list-item-title">{note.title}</p> : null}
              {note.content ? <p className="sticky-notes-list-item-content">{note.content}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="sticky-notes-list-message">{locale.stickyNotes.no_notes_message}</p>
      )}
      <CreateButton onClick={createNote} trackScroll></CreateButton>
    </div>
  );
}
