import { Button } from "@astryxdesign/core/Button"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"

import { countLinks } from "~/arc-import/parse-arc-sidebar"
import { useArcImport } from "~/arc-import/use-arc-import"
import { useOpenSidePanel } from "~/hooks/use-open-side-panel"

const isMac = navigator.userAgent.includes("Mac")
const card =
  "w-full max-w-lg rounded-3xl border border-black/5 bg-white/60 p-8 shadow-[0_30px_60px_-28px_rgba(30,20,40,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
const muted = "text-sm text-gray-600 dark:text-gray-300"
const row =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-black/5 px-3 py-2.5 text-sm text-gray-800 hover:bg-black/[0.03] dark:border-white/10 dark:text-gray-100 dark:hover:bg-white/[0.04]"
const code =
  "rounded border border-black/10 bg-black/5 px-1.5 py-0.5 font-mono text-xs break-all dark:border-white/10 dark:bg-white/10"

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function WhereToFind() {
  return isMac ? (
    <p className={`mt-3 ${muted}`}>
      In the file picker, press <kbd className={code}>⌘⇧G</kbd>, paste{" "}
      <code className={code}>
        ~/Library/Application Support/Arc/StorableSidebar.json
      </code>{" "}
      and press Return.
    </p>
  ) : (
    <p className={`mt-3 ${muted}`}>
      It's in <code className={code}>%LOCALAPPDATA%\Packages</code>, inside the
      folder that starts with{" "}
      <code className={code}>TheBrowserCompany.Arc</code>, under{" "}
      <code className={code}>LocalCache\Local\Arc</code>.
    </p>
  )
}

function ImportArc() {
  const arc = useArcImport()
  const panel = useOpenSidePanel()

  if (arc.result) {
    const { spaces, added, skipped, failed } = arc.result
    return (
      <div className={card}>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          Your Arc sidebar is in Shelf
        </h1>
        <p className={`mt-2 ${muted}`}>
          {plural(spaces, "space")} and {plural(added, "link")} added
          {skipped
            ? `; ${plural(skipped, "link")} you already had were skipped`
            : ""}
          .
        </p>
        {failed > 0 && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {plural(failed, "item")} couldn't be added. Importing again tries
            them again without duplicating the rest.
          </p>
        )}
        <Button
          className="mt-6 w-full"
          variant="primary"
          isDisabled={panel.state === "opening"}
          label={
            panel.state === "opened"
              ? "Opened — check the right side of your window"
              : "Open Shelf"
          }
          onClick={panel.open}
        />
        {panel.state === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Couldn't open it automatically — click the Shelf icon in your
            toolbar instead.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={card}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
        Import from Arc
      </h1>
      <p className={`mt-2 ${muted}`}>
        Brings each Arc space's pinned tabs and folders into Shelf as a space,
        and Arc's favorites into Shelf's favorites. Open Today tabs can come
        too.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Choose Arc's StorableSidebar.json
        </span>
        <input
          type="file"
          accept=".json,application/json"
          className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-gray-200 dark:file:bg-white/10"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void arc.readFile(file)
          }}
        />
      </label>
      <WhereToFind />

      {arc.sidebar && (
        <div className="mt-6 border-t border-black/5 pt-5 dark:border-white/10">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            What to bring over
          </p>
          {arc.sidebar.profiles.map((profile) => {
            const spaces = arc.sidebar!.spaces.filter(
              (space) => space.profile === profile.key
            )
            return (
              <div key={profile.key} className="mt-3">
                {arc.sidebar!.profiles.length > 1 && (
                  <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    {profile.label}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {spaces.map((space) => (
                    <label key={space.id} className={row}>
                      <input
                        type="checkbox"
                        checked={arc.spaceIds.has(space.id)}
                        onChange={() => arc.toggleSpace(space.id)}
                      />
                      <span className="flex-1">
                        {space.emoji ? `${space.emoji} ` : ""}
                        {space.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {[
                          countLinks(space.items) &&
                            plural(countLinks(space.items), "pinned link"),
                          space.today.length &&
                            plural(space.today.length, "open tab")
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </label>
                  ))}
                  {profile.favorites.length > 0 && (
                    <label className={row}>
                      <input
                        type="checkbox"
                        checked={arc.favoriteProfiles.has(profile.key)}
                        onChange={() => arc.toggleFavorites(profile.key)}
                      />
                      <span className="flex-1">Favorites</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {plural(profile.favorites.length, "link")}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )
          })}
          {arc.todayCount > 0 && (
            <label className={`mt-4 ${row}`}>
              <input
                type="checkbox"
                checked={arc.today}
                onChange={(event) => arc.setToday(event.target.checked)}
              />
              <span className="flex-1">
                Also keep the open Today tabs of the spaces above
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {plural(arc.todayCount, "tab")}
              </span>
            </label>
          )}
          <p className={`mt-3 ${muted}`}>
            Each space becomes a folder in your Bookmarks Bar; open tabs go to
            an "Arc Today" folder in Home, one folder per space. Anything you
            already have is filled in, not duplicated.
          </p>
          <Button
            className="mt-5 w-full"
            variant="primary"
            isDisabled={!arc.canImport}
            label={arc.isImporting ? "Importing…" : "Import"}
            onClick={() => void arc.run()}
          />
        </div>
      )}

      {arc.error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {arc.error}
        </p>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AstryxTheme theme={neutralTheme} mode="system">
      <div className="flex min-h-screen items-center justify-center p-6">
        <ImportArc />
      </div>
    </AstryxTheme>
  )
}
