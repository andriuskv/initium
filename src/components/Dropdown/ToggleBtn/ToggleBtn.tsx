import type { MouseEvent, ReactNode, RefObject } from "react";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";

type Props = {
  params: {
    className?: string,
    isIconTextBtn?: boolean,
    isTextBtn?: boolean,
    iconId?: string,
    title?: string,
    body?: ReactNode
  },
  visible: boolean,
  ref: RefObject<HTMLButtonElement>,
  toggleDropdown: (event: MouseEvent) => void
}

export default function ToggleBtn({ params, visible, ref, toggleDropdown }: Props) {
  const locale = useLocalization();
  const className = `${params.className ? ` ${params.className}` : ""}${visible ? " active" : ""}`;

  if (params.isIconTextBtn) {
    return (
      <button type="button" className={`btn icon-text-btn dropdown-toggle-btn${className}`} ref={ref}
        onClick={toggleDropdown}>
        <Icon id={params.iconId || "vertical-dots"}/>
        <span>{params.title}</span>
      </button>
    );
  }
  else if (params.isTextBtn) {
    return (
      <button type="button" className={`btn text-btn dropdown-toggle-btn${className}`} ref={ref}
        onClick={toggleDropdown}>{params.title}</button>
    );
  }
  return (
    <button type="button" className={`btn icon-btn dropdown-toggle-btn${className}`} ref={ref}
      onClick={toggleDropdown} title={params.title || locale.global.more}>
      {params.body ? params.body : <Icon id={params.iconId || "vertical-dots"}/>}
    </button>
  );
}
