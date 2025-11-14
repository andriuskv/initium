import type { DragStartEvent } from "@dnd-kit/core";
import type { MainPanelComponents } from "types/settings";
import type { PersistentSite, FormType } from "../top-sites.type";
import { useState, useEffect, lazy, Suspense } from "react";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";
import "./persistent-sites.css";

const Form = lazy(() => import("../Form"));

type Props = {
  settings: MainPanelComponents["topSites"],
  enableEdit?: boolean,
  locale: any,
  getFaviconURL: (url: string, size: number) => string
}

export default function PersistentSites({ settings, enableEdit, locale, getFaviconURL }: Props) {
  const [sites, setSites] = useState<PersistentSite[] | null>(null);
  const [siteEditEnabled, setSiteEditEnabled] = useState(enableEdit);
  const [form, setForm] = useState<FormType | null>(null);
  const [activeDragId, setActiveDragId] = useState("");

  function hideForm() {
    setForm(null);
  }

  useEffect(() => {
    function initSites(sites: PersistentSite[]) {
      return sites.map(site => {
        site.id = crypto.randomUUID();
        site.iconUrl = getFaviconURL(site.url, 32);
        return site;
      });
    }

    async function init() {
      const sites = await chromeStorage.get("persistentSites") || [];

      setSites(initSites(sites));

      chromeStorage.subscribeToChanges(({ persistentSites }) => {
        if (!persistentSites) {
          return;
        }

        if (persistentSites.newValue) {
          setSites(initSites(persistentSites.newValue));
        }
        else {
          setSites([]);
        }
        hideForm();
      });
    }

    function enableSiteEdit() {
      setSiteEditEnabled(true);
    }

    init();


    window.addEventListener("enable-persistent-site-edit", enableSiteEdit);

    return () => {
      window.removeEventListener("enable-persistent-site-edit", enableSiteEdit);
    };
  }, []);

  function disableSiteEdit() {
    setSiteEditEnabled(false);
  }

  function showForm(data = {}) {
    setForm(data);
  }

  function updateSite(site: Partial<PersistentSite>, action: "add" | "update"): string | undefined {
    if (!sites || !form) {
      return;
    }
    const siteUrl = site.url as string;
    const siteTitle = site.title as string;
    const isDuplicate = sites.some(({ url }) => siteUrl === url);
    const index = form.index as number;

    if (isDuplicate) {
      return "Site with the same URL already exists.";
    }

    if (action === "add") {
      const newSites = [...sites, {
        title: siteTitle,
        url: siteUrl,
        id:  crypto.randomUUID(),
        iconUrl:  getFaviconURL(siteUrl, 32)
      }];

      setSites(newSites);
      saveSites(newSites);
    }
    else if (action === "update" && site.title !== sites[index].title) {
      const newSites = sites.with(index, {
        title: siteTitle,
        url: siteUrl,
        id: crypto.randomUUID(),
        iconUrl: getFaviconURL(siteUrl, 32)
      });

      setSites(newSites);
      saveSites(newSites);
    }
  }

  function saveSites(sites: Partial<PersistentSite>[]) {
    chromeStorage.set({ persistentSites: structuredClone(sites).map(site => {
      delete site.id;
      delete site.iconUrl;
      return site;
    }) });
  }

  function editSite(index: number) {
    if (!sites) {
      return;
    }
    showForm({
      ...sites[index],
      index,
      updating: true
    });
  }

  function removeSite(index: number) {
    if (!sites) {
      return;
    }
    const newSites = sites.toSpliced(index, 1);

    setSites(newSites);
    saveSites(newSites);
  }

  function handleSort(sites: unknown[] | null) {
    if (sites) {
      setSites(sites as PersistentSite[]);
      saveSites(sites as PersistentSite[]);
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  if (!sites) {
    return null;
  }
  return (
    <>
      {siteEditEnabled ? (
        <>
          <ul className="persistent-sites">
            <SortableList
              axis="x"
              items={sites}
              handleSort={handleSort}
              handleDragStart={handleDragStart}>
              {sites.map((site, i) => (
                <SortableItem className={`top-site${site.id === activeDragId ? " dragging" : ""}`} id={site.id} key={site.id}>
                  <button className="top-site-link persistent-site-edit-btn" onClick={() => editSite(i)} title={locale.global.edit}>
                    <div className="container top-site-container top-site-thumbnail-container">
                      <img src={site.iconUrl} className="top-site-icon" width="24px" height="24px" loading="lazy" alt=""/>
                    </div>
                    <div className="container top-site-container top-site-title">{site.title}</div>
                    <Icon id="edit" className="persistent-site-edit-icon"/>
                  </button>
                  <button className="btn icon-btn persistent-site-remove-btn" onClick={() => removeSite(i)} title={locale.global.remove}>
                    <Icon id="trash"/>
                  </button>
                </SortableItem>
              ))}
            </SortableList>
            {sites.length < 8 && (
              <li className="top-site">
                <button className="top-site-link top-site-add-btn" onClick={showForm}>
                  <div className="container top-site-container top-site-thumbnail-container">
                    <Icon id="plus" className="top-site-add-btn-icon"/>
                  </div>
                  <div className="container top-site-container top-site-title">{locale.topSites.add_site_title}</div>
                </button>
              </li>
            )}
          </ul>
          <button className="btn icon-text-btn container top-site-container persistent-sites-cancel-edit-btn"
            onClick={disableSiteEdit}>
            <Icon id="cross"/>
            <span>{locale.global.done}</span>
          </button>
        </>
      ) : (
        <ul className="persistent-sites">
          {sites.map(site => (
            <li className="top-site" key={site.id}>
              <a href={site.url} className="top-site-link" aria-label={site.title} target={settings.openInNewTab ? "_blank" : "_self"} draggable="false">
                <div className="container top-site-container top-site-thumbnail-container">
                  <img src={site.iconUrl} className="top-site-icon" width="24px" height="24px" loading="lazy" alt="" draggable="false"/>
                </div>
                <div className="container top-site-container top-site-title">{site.title}</div>
              </a>
            </li>
          ))}
        </ul>
      )}
      {form ? (
        <Suspense fallback={null}>
          <Form form={form} locale={locale} updateSite={updateSite} hide={hideForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
