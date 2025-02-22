import type { PropsWithChildren } from "react";
import type { AppearanceSettings } from "types/settings";
import type { Note } from "types/stickyNotes";
import { createContext, useState, useEffect, use, useMemo } from "react";
import { replaceLink } from "utils";
import { useSettings } from "contexts/settings";
import { getSetting } from "services/settings";
import * as chromeStorage from "services/chromeStorage";

type StickyNotesContextType = {
  notes: Note[],
  createNote: (note: Note) => void,
  removeNote: (id: string) => void
  toggleHideNote: (id: string) => void
};

const StickyNotesContext = createContext<StickyNotesContextType>({} as StickyNotesContextType);

function StickyNotesProvider({ children }: PropsWithChildren) {
  const { settings } = useSettings();
  const [notes, setNotes] = useState<Note[]>([]);
  const memoizedValue = useMemo<StickyNotesContextType>(() => {
    return {
      notes,
      createNote,
      removeNote,
      toggleHideNote
    };
  }, [notes]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    setNotes(notes.map(note => {
      return {
        ...note,
        titleDisplayString: parseNoteField(note.title, settings.general.openLinkInNewTab),
        contentDisplayString: parseNoteField(note.content, settings.general.openLinkInNewTab)
      };
    }));
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
    }, { id: "stickyNotes" });
  }

  function parseNotes(notes: Note[]): Note[] {
    return notes.map(note => {
      note.id = crypto.randomUUID();
      note.titleDisplayString = parseNoteField(note.title, settings.general.openLinkInNewTab);
      note.contentDisplayString = parseNoteField(note.content, settings.general.openLinkInNewTab);

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

  function parseNoteField(value: string, openInNewTab: boolean) {
    const displayValue = value.replace(/<(.+?)>/g, (_, g1) => `&lt;${g1}&gt;`);
    return replaceLink(displayValue, "sticky-note-link", openInNewTab);
  }

  function createNote(note: Note) {
    const { action } = note;
    let newNotes = notes;

    delete note.index;
    delete note.action;

    note.title = note.title.trimEnd();
    note.content = note.content.trimEnd();

    note.titleDisplayString = parseNoteField(note.title, settings.general.openLinkInNewTab);
    note.contentDisplayString = parseNoteField(note.content, settings.general.openLinkInNewTab);

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

  function removeNote(id: string) {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    setNotes(notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          discarding: true
        };
      }
      return note;
    }));

    setTimeout(() => {
      const newNotes = notes.filter(note => note.id !== id);

      setNotes(newNotes);
      saveNotes(newNotes);
    }, 200 * animationSpeed);
  }

  function toggleHideNote(id: string) {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;
    let hidden = false;

    setNotes(notes.map(note => {
      if (note.id === id) {
        hidden = !note.hidden;

        return {
          ...note,
          togglingHide: true,
          discarding: hidden,
        };
      }
      return note;
    }));

    setTimeout(() => {
      const newNotes = notes.map(note => {
        if (note.id === id) {
          return {
            ...note,
            togglingHide: true,
            discarding: false,
            hidden
          };
        }
        return note;
      });

      setNotes(newNotes);
      saveNotes(newNotes);
    }, 200 * animationSpeed);
  }

  function saveNotes(notes: Note[]) {
    chromeStorage.set({ stickyNotes: structuredClone(notes).map(note => {
      delete note.id;
      delete note.titleDisplayString;
      delete note.contentDisplayString;
      delete note.contentDisplayString;
      delete note.discarding;
      delete note.togglingHide;
      return note;
    }) });
  }

  return <StickyNotesContext value={memoizedValue}>{children}</StickyNotesContext>;
}

function useNotes() {
  return use(StickyNotesContext);
}

export {
  StickyNotesProvider,
  useNotes
};
