import Icon from "components/Icon";
import "./splits.css";

type Props = {
  splits: {
    elapsed: number,
    elapsedString: string,
    diffString: string
  }[],
  locale: any,
  hide: () => void
}

export default function Splits({ splits, locale, hide } : Props) {
  return (
    <div className="stopwatch-splits-modal">
      <div className="container-header">
        <h3 className="container-header-title">{locale.stopwatch.splits_title}</h3>
        <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      </div>
      <ul className="stopwatch-splits-header">
        <li>#</li>
        <li>{locale.stopwatch.split_duration}</li>
        <li>{locale.stopwatch.split_diff}</li>
      </ul>
      <ul className="stopwatch-splits">
        {splits.map((split, index) => (
          <li className="stopwatch-split" key={index}>
            <span>#{splits.length - index}</span>
            <span>{split.elapsedString}</span>
            {split.diffString ? <span>{split.diffString}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
