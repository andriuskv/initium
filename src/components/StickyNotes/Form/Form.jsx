import { useState, useEffect, useLayoutEffect, useRef } from "react";
import * as focusService from "services/focus";
import { useNotes } from "contexts/stickyNotes";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./form.css";

const backgroundColors = [
  "#0d99ff", "#14b88f", "#8fe935", "#ffcd29",
  "#359ee9", "#14ae5c", "#66ca02", "#fcf403",
  "#6cb2e5", "#68cab1", "#ade07b", "#e3e078",
  "#ffa629", "#f24822", "#e935da", "#a34bfb",
  "#e9bc35", "#d24b2d", "#c20ab3", "#8f35e9",
  "#e3bb82", "#e0755c", "#e278da", "#ad7edd"
];

const textColors = [[0, 0, 0], [1, 0, 0]];

export default function Form({ initialForm, noteCount, locale, discardNote, showForm }) {
  const { createNote, removeNote } = useNotes();
  const [movable, setMovable] = useState(false);
  const [form, setForm] = useState(null);
  const containerRef = useRef(null);
  const moving = useRef(false);

  useLayoutEffect(() => {
    if (initialForm.discarding) {
      return () => {
        focusService.focusSelector("[data-focus-id=stickyNotes]");
      };
    }
    else if (initialForm.readyToShow) {
      if (containerRef.current) {
        focusService.resetIgnore();
        focusService.focusNthElement(containerRef.current, 1, { ignoreNext: true });
      }
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
        textStyle: {
          index: 0,
          color: textColors[0],
          opacity: 60,
          string: getTextColor(textColors[0], 60)
        },
        backgroundColor: backgroundColors[Math.floor(Math.random() * backgroundColors.length)],
        scale: 1,
        textScale: 1,
        tilt: getTilt()
      });
    }
    else if (initialForm.action === "edit") {
      setForm({ ...initialForm, scale: initialForm.scale || 1, textScale: initialForm.textScale || 1 });
    }
    showForm();
  }, [initialForm]);

  useEffect(() => {
    if (movable) {
      document.documentElement.style.userSelect = "none";
      document.documentElement.style.cursor = "move";

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.userSelect = "";
      document.documentElement.style.cursor = "";

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [movable]);

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
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      discardNote();
    }
  }

  function handleInputChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function moveNote(event) {
    const amount = event.ctrlKey ? 10 : 1;
    const noteSize = event.target.parentElement.offsetWidth + 40;
    const noteHeight = Math.floor(noteSize / document.documentElement.clientHeight * 100);
    const noteWidth = Math.floor(noteSize / 2 / document.documentElement.clientWidth * 100);

    if (event.key === "ArrowUp") {
      setForm({ ...form, y: Math.max(form.y - amount, 1) });
    }
    else if (event.key === "ArrowDown") {
      setForm({ ...form, y: Math.min(form.y + amount, 100 - noteHeight) });
    }
    else if (event.key === "ArrowLeft") {
      setForm({ ...form, x: Math.max(form.x - amount, noteWidth) });
    }
    else if (event.key === "ArrowRight") {
      setForm({ ...form, x: Math.min(form.x + amount, 100 - noteWidth) });
    }
  }

  function updateBackgroundColor(color) {
    setForm({ ...form, backgroundColor: color });
  }

  function getTextColor(textColor, opacity = 60) {
    return `oklch(${textColor.join(" ")} / ${opacity}%)`;
  }

  function updateTextColor(index) {
    const color = textColors[index];
    const string = getTextColor(color, form.textStyle.opacity);

    setForm({ ...form, textStyle: { ...form.textStyle, color, string, index } });
  }

  function adjustTextOpacity(direction) {
    const opacity = form.textStyle.opacity + 10 * direction;
    const string = getTextColor(form.textStyle.color, opacity);

    setForm({ ...form, textStyle: { ...form.textStyle, opacity, string } });
  }

  function adjustScale(key, direction) {
    setForm({ ...form, [key]: round(form[key] + 0.1125 * direction, 4) });
  }

  function saveNote() {
    createNote(form);
    discardNote(false);
  }

  function enableNoteDrag(event) {
    if (event.button === 0) {
      setMovable(true);
      setForm({
        ...form,
        tilt: getTilt()
      });
    }
  }

  function getTilt() {
    return Math.floor(Math.random() * 20) - 10;
  }

  function round(number, decimals) {
    return Math.round((number + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
  }

  if (!form) {
    return null;
  }
  return (
    <div className={`sticky-note sticky-note-form${movable ? " movable" : " editable"}${initialForm.discarding ? " discarding" : ""}${form.scale < 1 ? " scaled-down" : ""}`} key={form.id} ref={containerRef}
      style={{ "--x": form.x, "--y": form.y, "--tilt": form.tilt, "--scale": form.scale, "--text-scale": form.textScale, "--background-color": form.backgroundColor, "--text-color": form.textStyle.string }}>
      <div className="sticky-note-drag-handle" onPointerDown={enableNoteDrag} onKeyDown={moveNote} title={movable ? "" : locale.global.move} tabIndex="0"></div>
      <textarea className="input textarea sticky-note-content sticky-note-input sticky-note-title" name="title"
        onChange={handleInputChange} value={form.title}
        placeholder={`Note #${form.action === "edit" ? form.index + 1 : noteCount + 1}`}></textarea>
      <textarea className="input textarea sticky-note-content sticky-note-input" name="content" onChange={handleInputChange}
        value={form.content} placeholder={`Content #${form.action === "edit" ? form.index + 1 : noteCount + 1}`}></textarea>
      {movable ? null : (
        <>
          <div className="sticky-note-sidebar">
            <Dropdown toggle={{ iconId: "color-picker", title: locale.stickyNotes.color_picker }} body={{ className: "sticky-note-dropdown" }}>
              <ul className="sticky-note-color-picker-items">
                {backgroundColors.map(color => (
                  <li key={color}>
                    <button className={`btn sticky-note-color-picker-item${form.backgroundColor === color ? " active" : ""}`}
                      onClick={() => updateBackgroundColor(color)} style={{ backgroundColor: color }}></button>
                  </li>
                ))}
              </ul>
            </Dropdown>
            <Dropdown toggle={{ iconId: "text-color", title: locale.stickyNotes.text_color }} body={{ className: "sticky-note-dropdown" }}>
              <ul className="sticky-note-text-colors">
                {textColors.map((color, index) => (
                  <li key={color}>
                    <button className={`btn sticky-note-color-picker-item${form.textStyle.index === index ? " active" : ""}${index === 1 ? " black": ""}`}
                      onClick={() => updateTextColor(index)} style={{ backgroundColor: getTextColor(textColors[index], 100) }}></button>
                  </li>
                ))}
              </ul>
              <div className="dropdown-group sticky-note-setting">
                <button className="btn icon-btn"
                  onClick={() => adjustTextOpacity(-1)} title={locale.global.decrease_size_title} disabled={form.textStyle.opacity <= 10}>
                  <Icon id="minus"/>
                </button>
                <div className="sticky-note-setting-name">{locale.stickyNotes.text_opacity}</div>
                <button className="btn icon-btn"
                  onClick={() => adjustTextOpacity(1)} title={locale.global.increase_size_title} disabled={form.textStyle.opacity >= 100}>
                  <Icon id="plus"/>
                </button>
              </div>
            </Dropdown>
            <Dropdown toggle={{ iconId: "scale", title: locale.stickyNotes.scale }} body={{ className: "sticky-note-dropdown" }}>
              <div className="dropdown-group sticky-note-setting">
                <button className="btn icon-btn"
                  onClick={() => adjustScale("scale", -1)} title={locale.global.decrease_size_title} disabled={form.scale <= 0.75}>
                  <Icon id="minus"/>
                </button>
                <div className="sticky-note-setting-name">{locale.stickyNotes.scale}</div>
                <button className="btn icon-btn"
                  onClick={() => adjustScale("scale", 1)} title={locale.global.increase_size_title} disabled={form.scale >= 2}>
                  <Icon id="plus"/>
                </button>
              </div>
              <div className="dropdown-group sticky-note-setting">
                <button className="btn icon-btn"
                  onClick={() => adjustScale("textScale", -1)} title={locale.global.decrease_size_title} disabled={form.textScale <= 0.5}>
                  <Icon id="minus"/>
                </button>
                <div className="sticky-note-setting-name">{locale.global.text_size_title}</div>
                <button className="btn icon-btn"
                  onClick={() => adjustScale("textScale", 1)} title={locale.global.increase_size_title} disabled={form.textScale >= 2}>
                  <Icon id="plus"/>
                </button>
              </div>
            </Dropdown>
            {initialForm.action === "edit" ? (
              <button className="btn icon-btn" onClick={() => removeNote(initialForm.id)}>
                <Icon id="trash"/>
              </button>
            ) : null}
          </div>
          <div className="sticky-note-btns">
            <button className="btn" onClick={discardNote}>{locale.global.discard}</button>
            <button className="btn" onClick={saveNote}>{locale.global.save}</button>
          </div>
        </>
      )}
    </div>
  );
}
