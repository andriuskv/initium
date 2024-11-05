import React from "react";

type Props = {
  id: string,
  className: string,
  style?: React.CSSProperties,
  size?: string,
  title?: string
}

export default function Icon({ id, className, style = {}, size, title }: Props) {
  const dimensions = size ? { width: size, height: size } : {};

  return (
    <svg viewBox="0 0 24 24" className={`svg-icon${className ? ` ${className}` : ""}`} style={{ ... style, ...dimensions }}>
      {title && <title>{title}</title>}
      <use href={`#${id}`}></use>
    </svg>
  );
}
