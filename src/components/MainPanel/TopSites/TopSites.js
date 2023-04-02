/* global chrome */

import { useState, useEffect, lazy, Suspense } from "react";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./top-sites.css";

const Form = lazy(() => import("./Form"));
const PersistentSites = lazy(() => import("./PersistentSites"));

export default function TopSites({ settings }) {
  const [sites, setSites] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    init();

    window.addEventListener("reset-top-sites", resetTopSites);

    return () => {
      window.removeEventListener("reset-top-sites", resetTopSites);
    };
  }, []);

  async function init() {
    let data = getLocalSites();

    if (Array.isArray(data)) {
      data = { static: data };
      saveSites(data);
    }

    if (Array.isArray(data.static)) {
      const sites = parseSites(data.static, data);
      setSites(sites);
    }
    else {
      fetchTopSites(data);
    }
  }

  function fetchTopSites(localSites) {
    chrome.topSites.get(data => {
      const sites = parseSites(data, localSites);
      setSites(sites);
    });
  }

  function parseSites(sites, { filtered = [], modified = [] } = {}) {
    return sites.filter(site => !filtered.includes(site.url)).map(site => {
      const modifiedSite = modified.find(({ url }) => url === site.url);

      if (modifiedSite) {
        site.title = modifiedSite.title;
      }
      site.iconUrl = getFaviconURL(site.url);
      return site;
    });
  }

  function resetTopSites() {
    fetchTopSites();
    localStorage.removeItem("top sites");
  }

  function getFaviconURL(url) {
    const { href } = new URL(url);
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${href}&size=32`;
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
    const [site] = sites.splice(index, 1);

    setSites([...sites]);

    const data = getLocalSites();

    data.filtered ??= [];
    data.filtered.push(site.url);

    if (data.modified) {
      data.modified = data.modified.filter(item => item.url !== site.url);
    }
    saveSites(data);
  }

  function updateSite(site, action) {
    if (action === "add") {
      if (!sites.some(({ url }) => site.url === url)) {
        site.iconUrl = getFaviconURL(site.url);
        sites.push(site);
        setSites([...sites]);
        saveSites({ static: sites });
      }
    }
    else if (action === "update") {
      const oldSite = { ...sites[form.index] };

      sites[form.index] = {
        iconUrl: getFaviconURL(site.url),
        ...site
      };

      if (site.url !== oldSite.url) {
        saveSites({ static: sites });
      }
      else if (site.title !== oldSite.title) {
        const data = getLocalSites();

        data.modified ??= [];

        const index = data.modified.findIndex(({ url }) => site.url === url);

        if (index >= 0) {
          const modifiedSite = data.modified[index];

          if (site.title === modifiedSite.initialTitle) {
            data.modified.splice(index, 1);
          }
          else {
            data.modified[index] = {
              ...site,
              initialTitle: modifiedSite.initialTitle
            };
          }
        }
        else {
          data.modified.push({
            ...site,
            initialTitle: oldSite.title
          });
        }

        saveSites(data);
      }
      setSites([...sites]);
    }
  }

  function saveSites(data) {
    localStorage.setItem("top sites", JSON.stringify(data));
  }

  function getLocalSites() {
    return JSON.parse(localStorage.getItem("top sites")) || {};
  }

  if (!sites) {
    return null;
  }
  const visibleSites = sites.slice(0, settings.visibleItemCount);

  return (
    <>
      <ul className="top-sites">
        {visibleSites.map((site, i) => (
          <li className="top-site" key={site.url}>
            <a href={site.url} className="top-site-link" aria-label={site.title} target={settings.openInNewTab ? "_blank" : "_self"}>
              <div className="container top-site-container top-site-title">{site.title}</div>
              <div className="container top-site-container top-site-thumbnail-container">
                <img src={site.iconUrl} className="top-site-icon" width="32px" height="32px" loading="lazy" alt=""/>
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
            <button className="top-site-link top-site-add-btn" onClick={() => showForm()}>
              <div className="container top-site-container top-site-title">Add site</div>
              <div className="container top-site-container top-site-thumbnail-container">
                <Icon id="plus" className="top-site-add-btn-icon"/>
              </div>
            </button>
          </li>
        )}
      </ul>
      {settings.persistentSitesHidden ? null : (
        <Suspense fallback={null}>
          <PersistentSites settings={settings} getFaviconURL={getFaviconURL}/>
        </Suspense>
      )}
      {form ? (
        <Suspense fallback={null}>
          <Form form={form} updateSite={updateSite} hide={hideForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
