import json from "./google-apps.json";
import "./google-apps.css";

export default function GoogleApps() {
  return (
    <ul className="apps">
      {json.apps.map((app, i) => (
        <li key={i}>
          <a href={app.url} className="btn icon-btn apps-item-link">
            <img src={app.iconPath} className="apps-item-icon" width="48px" height="48px" loading="lazy"alt=""/>
            <div className="apps-item-title">{app.title}</div>
          </a>
        </li>
      ))}
    </ul>
  );
}
