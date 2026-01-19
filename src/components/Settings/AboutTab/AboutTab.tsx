import "./AboutTab.css";
import { parseLocaleString } from "utils";

export default function AboutTab({ locale }: { locale: any }) {
  const issuesText = parseLocaleString(locale.settings.about.issues_text, <a href={process.env.ISSUES_URL} className="about-tab-link" target="_blank" key="github">GitHub</a>);

  return (
    <div className="container-body setting-tab">
      <div className="about-tab-header">
        <img src="assets/128.png" className="about-tab-header-img" alt="" />
        <h4 className="about-tab-header-text">Initium New Tab</h4>
      </div>
      <h5 className="about-tab-text about-tab-subtitle">{locale.settings.about.subtitle}</h5>
      <p className="about-tab-text">{issuesText}</p>
      <div className="about-tab-tip">
        <p className="about-tab-text">{locale.settings.about.tip_text}</p>
        <div className="about-tab-tip-links">
          <ul>
            <li><a href={process.env.DONATE_LINK_A} className="about-tab-link" target="_blank">Ko-fi</a></li>
          </ul>
        </div>
      </div>
      <div className="about-tab-bottom">
        <p>{locale.settings.about.version}: {chrome.runtime.getVersion()}</p>
      </div>
    </div>
  );
}
