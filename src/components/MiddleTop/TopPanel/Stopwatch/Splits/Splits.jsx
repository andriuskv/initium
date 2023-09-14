import Icon from "components/Icon";
import "./splits.css";

export default function Splits({ splits, hide }) {
  return (
    <div className="stopwatch-splits-modal">
      <div className="container-header">
        <h3 className="container-header-title">Splits</h3>
        <button className="btn icon-btn" onClick={hide} title="Close">
          <Icon id="cross"/>
        </button>
      </div>
      <ul className="stopwatch-splits-header">
        <li>#</li>
        <li>DURATION</li>
        <li>DIFFERENCE</li>
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
