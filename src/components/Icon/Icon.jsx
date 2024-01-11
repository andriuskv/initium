export default function Icon({ id, className, style = {}, size, title }) {
  const dimensions = size ? { width: size, height: size } : {};

  return (
    <svg viewBox="0 0 24 24" className={`svg-icon${className ? ` ${className}` : ""}`} style={{ ... style, ...dimensions }}>
      {title && <title>{title}</title>}
      <use href={`#${id}`}></use>
    </svg>
  );
}
