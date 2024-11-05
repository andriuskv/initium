import Icon from "components/Icon";

type Props = {
  className: string,
  size?: string,
}

export default function Spinner({ className, size }: Props) {
  return <Icon id="spinner" className={className} size={size} style={{ color: "var(--color-primary)" }}/>;
}
