/* global chrome */

import { useState, useEffect, lazy, Suspense } from "react";
import { getRandomString } from "utils";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./top-sites.css";

const Form = lazy(() => import("./Form"));

export default function TopSites({ settings }) {
  const [sites, setSites] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    init();
    window.addEventListener("top-sites-reset", resetTopSites);

    return () => {
      window.removeEventListener("top-sites-reset", resetTopSites);
    };
  }, []);

  function init() {
    const sites = JSON.parse(localStorage.getItem("top sites"));

    if (Array.isArray(sites)) {
      setSites(sites);
    }
    else {
      fetchTopSites();
    }
  }

  function fetchTopSites() {
    chrome.topSites.get(data => {
      const sites = data.map(site => {
        const { href } = new URL(site.url);

        site.id = getRandomString(4);
        site.iconUrl = `chrome://favicon/size/16@2x/${href}`;

        return site;
      });

      setSites(sites);
    });
  }

  function resetTopSites() {
    fetchTopSites();
    localStorage.removeItem("top sites");
  }

  function showForm() {
    setForm({});
  }

  function hideForm() {
    setForm(null);
  }

  function editSite(index) {
    setForm({
      ...sites[index],
      index,
      updating: true
    });
  }

  function removeSite(index) {
    sites.splice(index, 1);
    updateSites(sites);
  }

  function updateSites(sites) {
    setSites([...sites]);
    saveSites(sites);
  }

  function saveSites(sites) {
    localStorage.setItem("top sites", JSON.stringify(sites));
  }

  if (!sites) {
    return null;
  }
  else if (form) {
    return (
      <Suspense fallback={null}>
        <Form form={form} sites={sites} updateSites={updateSites} hide={hideForm}/>
      </Suspense>
    );
  }
  const visibleSites = sites.slice(0, settings.visibleItemCount);

  return (
    <ul className="top-sites">
      {visibleSites.map((site, i) => (
        <li className="top-site" key={site.id}>
          <a href={site.url} className="top-site-link" aria-label={site.title}>
            <div className="container top-site-container top-site-title">{site.title}</div>
            <div className="container top-site-container top-site-thumbnail-container">
              <img src={site.iconUrl} className="top-site-thumbnail" alt=""/>
            </div>
          </a>
          <Dropdown container={{ className: "top-site-dropdown" }}>
            <button className="btn icon-text-btn dropdown-btn" onClick={() => editSite(i)}>
              <Icon id="edit"/>
              <span>Edit</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn" onClick={() => removeSite(i)}>
              <Icon id="trash"/>
              <span>Remove</span>
            </button>
          </Dropdown>
        </li>
      ))}
      {visibleSites.length < settings.visibleItemCount && !settings.addSiteButtonHidden && (
        <li className="top-site">
          <button className="top-site-link top-site-add-btn" onClick={showForm}>
            <div className="container top-site-container top-site-title">Add site</div>
            <div className="container top-site-container top-site-thumbnail-container">
              <Icon id="plus" className="top-site-add-btn-icon"/>
            </div>
          </button>
        </li>
      )}
    </ul>
  );
}
