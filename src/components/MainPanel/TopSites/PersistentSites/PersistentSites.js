import { useState, useEffect, lazy, Suspense } from "react";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import "./persistent-sites.css";

const Form = lazy(() => import("../Form"));

export default function PersistentSites({ settings, getFaviconURL }) {
  const [sites, setSites] = useState(null);
  const [siteEditEnabled, setSiteEditEnabled] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    init();

    window.addEventListener("enable-persistent-site-edit", enableSiteEdit);

    return () => {
      window.removeEventListener("enable-persistent-site-edit", enableSiteEdit);
    };
  }, []);

  async function init() {
    const sites = await chromeStorage.get("persistentSites") || [];

    setSites(sites.map(site => {
      site.iconUrl = getFaviconURL(site.url);
      return site;
    }));

    chromeStorage.subscribeToChanges(({ persistentSites }) => {
      if (!persistentSites) {
        return;
      }

      if (persistentSites.newValue) {
        setSites(persistentSites);
      }
      else {
        setSites([]);
      }
      hideForm();
    });
  }

  function enableSiteEdit(event) {
    setSiteEditEnabled(event.detail);
  }

  function showForm(data = {}) {
    setForm(data);
  }

  function hideForm() {
    setForm(null);
  }

  function updateSite(site, action) {
    if (action === "add") {
      if (!sites.some(({ url }) => site.url === url)) {
        site.iconUrl = getFaviconURL(site.url);
        sites.push(site);
        setSites([...sites]);
        saveSites(sites);
      }
    }
    else if (action === "update") {
      sites[form.index] = {
        iconUrl: getFaviconURL(site.url),
        ...site
      };
      setSites([...sites]);
      saveSites(sites);
    }
  }

  function saveSites(sites) {
    chromeStorage.set({ persistentSites: sites.map(site => {
      delete site.iconUrl;
      return site;
    }) });
  }

  function editSite(index) {
    showForm({
      ...sites[index],
      index,
      updating: true
    });
  }

  function removeSite(index) {
    sites.splice(index, 1);
    setSites([...sites]);
    saveSites(sites);
  }

  if (!sites) {
    return null;
  }
  return (
    <>
      <ul className={`persistent-sites${siteEditEnabled ? " edit" : ""}`}>
        {sites.map((site, i) => (
          <li className="top-site" key={site.url}>
            {siteEditEnabled ? (
              <button className="top-site-link persistent-site-edit-btn" onClick={() => editSite(i)} title="Edit">
                <div className="container top-site-container top-site-thumbnail-container">
                  <img src={site.iconUrl} className="top-site-icon" width="24px" height="24px" loading="lazy" alt=""/>
                </div>
                <div className="container top-site-container top-site-title">{site.title}</div>
                <Icon id="edit" className="persistent-site-edit-icon"/>
              </button>
            ) : (
              <a href={site.url} className="top-site-link" aria-label={site.title} target={settings.openInNewTab ? "_blank" : "_self"}>
                <div className="container top-site-container top-site-thumbnail-container">
                  <img src={site.iconUrl} className="top-site-icon" width="24px" height="24px" loading="lazy" alt=""/>
                </div>
                <div className="container top-site-container top-site-title">{site.title}</div>
              </a>
            )}
            {siteEditEnabled && (
              <button className="btn icon-btn persistent-site-remove-btn" onClick={() => removeSite(i)} title="Remove">
                <Icon id="trash"/>
              </button>
            )}
          </li>
        ))}
        {sites.length < 8 && siteEditEnabled && (
          <li className="top-site">
            <button className="top-site-link top-site-add-btn" onClick={showForm}>
              <div className="container top-site-container top-site-thumbnail-container">
                <Icon id="plus" className="top-site-add-btn-icon"/>
              </div>
              <div className="container top-site-container top-site-title">Add site</div>
            </button>
          </li>
        )}
      </ul>
      {form ? (
        <Suspense fallback={null}>
          <Form form={form} updateSite={updateSite} hide={hideForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
