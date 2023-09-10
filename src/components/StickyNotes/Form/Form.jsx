import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./form.css";

const colors = [
  "#0d99ff", "#14b88f", "#8fe935", "#ffcd29",
  "#359ee9", "#14ae5c", "#66ca02", "#fcf403",
  "#6cb2e5", "#68cab1", "#ade07b", "#e3e078",
  "#ffa629", "#f24822", "#e935da", "#a34bfb",
  "#e9bc35", "#d24b2d", "#c20ab3", "#8f35e9",
  "#e3bb82", "#e0755c", "#e278da", "#ad7edd"
];

export default function Form({ initialForm, noteCount, createNote, discardNote, showForm }) {
  const [movable, setMovable] = useState(false);
  const [editable, setEditable] = useState(false);
  const [form, setForm] = useState(null);
  const moving = useRef(false);

  useLayoutEffect(() => {
    if (initialForm.readyToShow) {
      return;
    }

    if (initialForm.action === "create") {
      setForm({
        action: initialForm.action,
        id: crypto.randomUUID(),
        x: initialForm.x,
        y: initialForm.y,
        title: "",
        content: "",
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: getTilt()
      });
      setEditable(false);
      setMovable(true);
    }
    else if (initialForm.action === "edit") {
      setForm({ ...initialForm });
      setEditable(true);
    }
    showForm();
  }, [initialForm]);

  useEffect(() => {
    if (movable) {
      document.documentElement.style.userSelect = "none";
      document.documentElement.style.cursor = "move";

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      document.documentElement.style.userSelect = "";
      document.documentElement.style.cursor = "";

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [movable]);

  useEffect(() => {
    if (movable || editable) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [movable, editable]);

  function handlePointerMove(event) {
    if (moving.current) {
      return;
    }
    moving.current = true;

    requestAnimationFrame(() => {
      const x = event.clientX / document.documentElement.clientWidth * 100;
      const y = event.clientY / document.documentElement.clientHeight * 100;

      setForm({ ...form, x, y });
      moving.current = false;
    });
  }

  function handlePointerUp() {
    setMovable(false);
    setEditable(true);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      discardNote();
    }
  }

  function handleInputChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateColor(color) {
    setForm({ ...form, color });
  }

  function saveNote() {
    createNote(form);
    discardNote();
  }

  function enableNoteDrag() {
    setMovable(true);
  }

  function getTilt() {
    return Math.floor(Math.random() * 20) - 10;
  }

  if (!form) {
    return null;
  }
  return (
    <div className={`sticky-note sticky-note-form${movable ? " movable" : ""}${editable ? " editable" : ""}`} key={form.id}
      style={{ "--x": form.x, "--y": form.y, "--tilt": form.tilt, "--background-color": form.color }}>
      <div className="sticky-note-drag-handle" onPointerDown={enableNoteDrag} title={movable ? "" : "Move"}></div>
      <input className="input sticky-note-title sticky-note-input" name="title" onChange={handleInputChange}
        value={form.title} placeholder={`Note #${form.action === "edit" ? form.index + 1 : noteCount + 1}`}/>
      <textarea className="input sticky-note-input sticky-note-content-input" name="content" onChange={handleInputChange}
        value={form.content} placeholder={`Content #${form.action === "edit" ? form.index + 1 : noteCount + 1}`}></textarea>
      {editable ? (
        <>
          <div className="sticky-note-sidebar">
            <Dropdown toggle={{ iconId: "color-picker", title: "Color picker" }} body={{ className: "sticky-note-dropdown" }}>
              <ul className="sticky-note-color-picker-items">
                {colors.map(color => (
                  <li key={color}>
                    <button className={`btn sticky-note-color-picker-item${form.color === color ? " active" : ""}`}
                      onClick={() => updateColor(color)} style={{ backgroundColor: color }}></button>
                  </li>
                ))}
              </ul>
            </Dropdown>
          </div>
          <div className="sticky-note-btns">
            <button className="btn" onClick={discardNote}>Discard</button>
            <button className="btn" onClick={saveNote}>Save</button>
          </div>
        </>
      ) : null}
    </div>
  );
}
