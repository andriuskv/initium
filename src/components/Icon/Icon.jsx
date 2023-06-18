export default function Icon({ id, className, style, title }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      {title && <title>{title}</title>}
      <use href={`#${id}`}></use>
    </svg>
  );
}
