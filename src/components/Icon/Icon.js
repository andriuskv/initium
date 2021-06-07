export default function Icon({ id, className, title }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      {title && <title>{title}</title>}
      <use href={`#${id}`}></use>
    </svg>
  );
}
