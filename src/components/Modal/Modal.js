import "./modal.css";

export default function Modal({ className, children }) {
  return (
    <div className="modal-mask">
      <div className={`container modal${className ? ` ${className}` : ""}`}>{children}</div>
    </div>
  );
}
