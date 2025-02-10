/* global chrome */

import type { MainPanelComponents, AppearanceSettings } from "types/settings";
import type { Site } from "./top-sites.type";
import { useState, useEffect, useRef } from "react";
import { useModal } from "hooks";
import { getSetting } from "services/settings";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./top-sites.css";
import Form from "./Form";
import PersistentSites from "./PersistentSites";

type Props = {
  settings: MainPanelComponents["topSites"],
  locale: any
}

type LocalData = {
  filtered?: string[],
  modified?: {
    initialTitle: string,
    title: string,
    url: string
  }[]
  sites?: Site[]
};

export default function TopSites({ settings, locale }: Props) {
  const [sites, setSites] = useState<Site[]>(null);
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const first = useRef(true);

  useEffect(() => {
    init();

    window.addEventListener("reset-top-sites", resetTopSites);

    return () => {
      window.removeEventListener("reset-top-sites", resetTopSites);
    };
  }, []);

  async function init() {
    const data = getLocalSites();
    let sites = [];

    if (Array.isArray(data.sites)) {
      const localSites = parseSites(data.sites, data);
      sites = sites.concat(localSites);
    }
    const chromeSites = await fetchTopSites(data);

    for (const site of chromeSites) {
      if (!sites.some(({ url }) => site.url === url)) {
        sites.push(site);
      }
    }
    setSites(sites);
  }

  async function fetchTopSites(localData?: LocalData) {
    const sites = await chrome.topSites.get() as { url: string, title: string }[];
    return parseSites(sites, localData);
  }

  function parseSites(sites: Site[], { filtered = [], modified = [] }: LocalData) {
    return sites.filter(site => !filtered.includes(site.url)).map(site => {
      const modifiedSite = modified.find(({ url }) => url === site.url);

      if (modifiedSite) {
        site.title = modifiedSite.title;
      }
      site.iconUrl = getFaviconURL(site.url);
      return site;
    });
  }

  async function resetTopSites() {
    const sites = await fetchTopSites();

    setSites(sites);
    localStorage.removeItem("top sites");
  }

  function getFaviconURL(url: string) {
    const { href } = new URL(url);
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${href}&size=32`;
  }

  function showForm() {
    setModal({});
  }

  function editSite(index: number) {
    setModal({
      ...sites[index],
      index,
      updating: true
    });
  }

  function removeSite(index: number) {
    const site = sites[index];
    const data = getLocalSites();

    setSites(sites.toSpliced(index, 1));

    if (site.local) {
      data.sites = data.sites.filter(item => item.url !== site.url);
    }
    else {
      data.filtered ??= [];
      data.filtered.push(site.url);

      if (data.modified) {
        data.modified = data.modified.filter(item => item.url !== site.url);
      }
    }
    saveSites(data);
  }

  function isUniqueSite(site: Site, sites: Site[]) {
    return !sites.some(({ url }) => site.url === url);
  }

  function updateSite(site: Site, action: "add" | "update") {
    if (action === "add") {
      if (!isUniqueSite(site, sites)) {
        return;
      }
      site.local = true;
      site.iconUrl = getFaviconURL(site.url);
      let index = sites.findLastIndex(site => site.local);

      if (index < 0) {
        index = 0;
      }
      else {
        index += 1;
      }
      // Append site after the last local site
      setSites(sites.toSpliced(index, 0, site));
      saveSite(site);
    }
    else if (action === "update") {
      const oldSite = { ...sites[modal.index] };
      const updatedSite = {
        iconUrl: getFaviconURL(site.url),
        ...site
      };

      if (site.url !== oldSite.url) {
        if (!isUniqueSite(site, sites)) {
          return;
        }
        const data = getLocalSites();

        if (data.modified) {
          data.modified = data.modified.filter(item => item.url !== oldSite.url);
        }
        updatedSite.local = true;

        data.sites ??= [];
        data.sites.push(updatedSite);
        setSites(sites.with(modal.index, updatedSite));
        saveSites(data);
      }
      else if (site.title !== oldSite.title) {
        if (oldSite.local) {
          updatedSite.local = true;

          saveSite(updatedSite);
          setSites(sites.with(modal.index, updatedSite));
          return;
        }
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
        setSites(sites.with(modal.index, updatedSite));
        saveSites(data);
      }
    }
  }

  function saveSite(site: Site) {
    const data = getLocalSites();
    data.sites ??= [];

    const index = data.sites.findIndex(({ url }) => site.url === url);

    if (index >= 0) {
      data.sites = data.sites.with(index, site);
    }
    else {
      data.sites.push(site);
    }
    saveSites(data);
  }

  function saveSites(data: LocalData) {
    let sites = undefined;

    if (data.sites) {
      sites = structuredClone(data.sites).map(site => {
        delete site.iconUrl;
        return site;
      });
    }
    localStorage.setItem("top sites", JSON.stringify({
      ...data,
      sites
    }));
  }

  function getLocalSites(): LocalData {
    return JSON.parse(localStorage.getItem("top sites")) || {};
  }

  if (!sites) {
    return null;
  }
  const visibleSites = sites.slice(0, settings.visibleItemCount);

  return (
    <>
      <ul className={`top-sites${first.current ? " first" : ""}`} ref={element => {
        if (element && first.current) {
          const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

          setTimeout(() => {
            element.classList.remove("first");
          }, 400 * animationSpeed);
        }
        first.current = false;
      }}>
        {visibleSites.map((site, i) => (
          <li className="top-site" key={site.url}>
            <a href={site.url} className="top-site-link" aria-label={site.title} target={settings.openInNewTab ? "_blank" : "_self"} draggable="false">
              <div className="container top-site-container top-site-title">{site.title}</div>
              <div className="container top-site-container top-site-thumbnail-container">
                <img src={site.iconUrl} className="top-site-icon" width="32px" height="32px" loading="lazy" alt="" draggable="false"/>
              </div>
            </a>
            <Dropdown container={{ className: "top-site-dropdown" }}>
              <button className="btn icon-text-btn dropdown-btn" onClick={() => editSite(i)}>
                <Icon id="edit"/>
                <span>{locale.global.edit}</span>
              </button>
              <button className="btn icon-text-btn dropdown-btn" onClick={() => removeSite(i)}>
                <Icon id="trash"/>
                <span>{locale.global.remove}</span>
              </button>
            </Dropdown>
          </li>
        ))}
        {visibleSites.length < settings.visibleItemCount && !settings.addSiteButtonHidden && (
          <li className="top-site">
            <button className="top-site-link top-site-add-btn" onClick={() => showForm()}>
              <div className="container top-site-container top-site-title">{locale.topSites.add_site_title}</div>
              <div className="container top-site-container top-site-thumbnail-container">
                <Icon id="plus" className="top-site-add-btn-icon"/>
              </div>
            </button>
          </li>
        )}
      </ul>
      {settings.persistentSitesHidden ? null : (
        <PersistentSites settings={settings} locale={locale} getFaviconURL={getFaviconURL}/>
      )}
      {modal ? (
        <Form form={modal} locale={locale} updateSite={updateSite} hiding={modalHiding} hide={hideModal}/>
      ) : null}
    </>
  );
}
