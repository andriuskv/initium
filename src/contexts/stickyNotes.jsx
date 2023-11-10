import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { getSetting } from "services/settings";
import * as chromeStorage from "services/chromeStorage";

const StickyNotesContext = createContext();

function StickyNotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const memoizedValue = useMemo(() => {
    return {
      notes,
      createNote,
      removeNote
    };
  }, [notes]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const notes = await chromeStorage.get("stickyNotes") ?? [];

    setNotes(notes.map(note => {
      if (note.color) {
        note.backgroundColor = note.color;
        delete note.color;
      }

      if (!note.textStyle) {
        note.textStyle = {
          index: 0,
          color: [0, 0, 0],
          opacity: 60,
          string: "oklch(0 0 0 / 60%)"
        };
      }
      note.id = crypto.randomUUID();
      return note;
    }));

    chromeStorage.subscribeToChanges(({ stickyNotes }) => {
      if (!stickyNotes) {
        return;
      }

      if (stickyNotes.newValue) {
        setNotes(stickyNotes.newValue.map(note => {
          note.id = crypto.randomUUID();
          return note;
        }));
      }
      else {
        setNotes([]);
      }
    });
  }

  function createNote(note) {
    const { action } = note;
    let newNotes = notes;

    delete note.index;
    delete note.action;

    note.title = note.title.trimEnd();
    note.content = note.content.trimEnd();

    if (action === "create") {
      newNotes = [...notes, note];
    }
    else if (action === "edit") {
      newNotes = notes.filter(({ id }) => id !== note.id);
      newNotes = [...newNotes, note];
    }
    setNotes(newNotes);
    saveNotes(newNotes);
  }

  function removeNote(id) {
    const { animationSpeed } = getSetting("appearance");
    const note = notes.find(note => note.id === id);

    note.discarding = true;

    setNotes([...notes]);

    setTimeout(() => {
      const newNotes = notes.filter(note => note.id !== id);

      setNotes([...newNotes]);
      saveNotes(newNotes);
    }, 200 * animationSpeed);
  }

  function saveNotes(notes) {
    chromeStorage.set({ stickyNotes: structuredClone(notes).map(note => {
      delete note.id;
      return note;
    }) });
  }

  return <StickyNotesContext.Provider value={memoizedValue}>{children}</StickyNotesContext.Provider>;
}

function useNotes() {
  return useContext(StickyNotesContext);
}

export {
  StickyNotesProvider,
  useNotes
};
