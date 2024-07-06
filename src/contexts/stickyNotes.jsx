import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { replaceLink } from "utils";
import { useSettings } from "contexts/settings";
import { getSetting } from "services/settings";
import * as chromeStorage from "services/chromeStorage";

const StickyNotesContext = createContext();

function StickyNotesProvider({ children }) {
  const { settings } = useSettings();
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

  useEffect(() => {
    for (const note of notes) {
      note.titleDisplayString = parseNoteField(note.title, settings.general.openLinkInNewTab);
      note.contentDisplayString = parseNoteField(note.content, settings.general.openLinkInNewTab);
    }
    setNotes([...notes]);
  }, [settings.general.openLinkInNewTab]);

  async function init() {
    const notes = await chromeStorage.get("stickyNotes") ?? [];

    setNotes(parseNotes(notes));

    chromeStorage.subscribeToChanges(({ stickyNotes }) => {
      if (!stickyNotes) {
        return;
      }

      if (stickyNotes.newValue) {
        setNotes(parseNotes(stickyNotes.newValue));
      }
      else {
        setNotes([]);
      }
    });
  }

  function parseNotes(notes) {
    return notes.map(note => {
      note.id = crypto.randomUUID();
      note.titleDisplayString = parseNoteField(note.title, settings.general.openLinkInNewTab);
      note.contentDisplayString = parseNoteField(note.content, settings.general.openLinkInNewTab);

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
      return note;
    });
  }

  function parseNoteField(value, openInNewTab) {
    const displayValue = value.replace(/<(.+?)>/g, (_, g1) => `&lt;${g1}&gt;`);
    return replaceLink(displayValue, "sticky-note-link", openInNewTab);
  }

  function createNote(note) {
    const { action } = note;
    let newNotes = notes;

    delete note.index;
    delete note.action;

    note.title = note.title.trimEnd();
    note.content = note.content.trimEnd();

    note.titleDisplayString = parseNoteField(note.title);
    note.contentDisplayString = parseNoteField(note.content);

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
      delete note.titleDisplayString;
      delete note.contentDisplayString;
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
