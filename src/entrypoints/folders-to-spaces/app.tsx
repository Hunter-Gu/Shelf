import { Button } from "@astryxdesign/core/Button"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import { FolderIcon } from "lucide-react"

import { EmojiButton } from "~/components/emoji-button"
import { useFolderSpaces } from "~/folder-spaces/use-folder-spaces"
import { useOpenSidePanel } from "~/hooks/use-open-side-panel"

const card =
  "w-full max-w-lg rounded-3xl border border-black/5 bg-white/60 p-8 shadow-[0_30px_60px_-28px_rgba(30,20,40,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
const muted = "text-sm text-gray-600 dark:text-gray-300"
const row =
  "flex items-start gap-3 rounded-xl border border-black/5 px-3 py-2.5 text-sm text-gray-800 dark:border-white/10 dark:text-gray-100"
const meta = "text-xs text-gray-500 dark:text-gray-400"
const folderIcon = (
  <FolderIcon className="h-full w-full text-gray-500 dark:text-gray-400" />
)

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function FoldersToSpaces() {
  const spaces = useFolderSpaces()
  const panel = useOpenSidePanel()

  if (spaces.result) {
    const { spaces: added, failed } = spaces.result
    return (
      <div className={card}>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {plural(added, "space")} added
        </h1>
        <p className={`mt-2 ${muted}`}>
          They're in Shelf's dock, at the bottom of the panel.
        </p>
        {failed > 0 && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {plural(failed, "folder")} couldn't be changed. Reload this page to
            try them again.
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

  const count = spaces.chosen.size

  return (
    <div className={card}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
        Turn folders into spaces
      </h1>
      <p className={`mt-2 ${muted}`}>
        Pick the folders you want as spaces. You can rename them and give each
        an emoji.
      </p>

      {spaces.candidates?.length === 0 && (
        <p className={`mt-6 ${muted}`}>
          There are no folders left to turn into spaces.
        </p>
      )}

      {!!spaces.candidates?.length && (
        <>
          <div className="mt-6 flex flex-col gap-2">
            {spaces.candidates.map((folder) => {
              const choice = spaces.chosen.get(folder.id)
              const problem = spaces.problemOf(folder.id)
              const renamed = choice && choice.name.trim() !== folder.title
              return (
                <div
                  key={folder.id}
                  className={`${row} ${choice ? "bg-black/[0.03] dark:bg-white/[0.04]" : ""}`}>
                  <input
                    id={`folder-${folder.id}`}
                    type="checkbox"
                    className="mt-2.5"
                    aria-label={`Make ${folder.title} a space`}
                    checked={!!choice}
                    onChange={() => spaces.toggle(folder.id)}
                  />
                  {choice ? (
                    <>
                      <EmojiButton
                        label={`Choose an emoji for ${folder.title}`}
                        className="h-9 w-9 shrink-0 p-2 text-xl"
                        emoji={choice.logo}
                        placeholder={folderIcon}
                        onEmojiSelect={(logo) =>
                          spaces.setLogo(folder.id, logo)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <TextInput
                          label="Space name"
                          isLabelHidden
                          size="sm"
                          placeholder={folder.title}
                          value={choice.name}
                          onChange={(name) => spaces.rename(folder.id, name)}
                          status={problem ? { type: "error" } : undefined}
                        />
                        {problem && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {problem}
                          </p>
                        )}
                        <p className={`mt-1 ${meta}`}>
                          {folder.location}
                          {renamed ? ` · was "${folder.title}"` : ""}
                        </p>
                      </div>
                    </>
                  ) : (
                    <label
                      htmlFor={`folder-${folder.id}`}
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <span className="h-9 w-9 shrink-0 p-2">{folderIcon}</span>
                      <span className="min-w-0 flex-1 pt-1">
                        <span className="block truncate">{folder.title}</span>
                        <span className={`block ${meta}`}>
                          {folder.location}
                        </span>
                      </span>
                    </label>
                  )}
                  <span className={`shrink-0 pt-2.5 ${meta}`}>
                    {plural(folder.bookmarks, "bookmark")}
                  </span>
                </div>
              )
            })}
          </div>
          <p className={`mt-3 ${muted}`}>
            Folders stay in your bookmarks. Names and emoji are saved to the
            folder name, and folders outside the Bookmarks Bar move there.
          </p>
          <Button
            className="mt-5 w-full"
            variant="primary"
            isDisabled={!count || spaces.isWorking}
            label={
              spaces.isWorking
                ? "Working…"
                : count
                  ? `Make ${plural(count, "space")}`
                  : "Choose a folder"
            }
            onClick={() => void spaces.run()}
          />
        </>
      )}

      {spaces.error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {spaces.error}
        </p>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AstryxTheme theme={neutralTheme} mode="system">
      <div className="flex min-h-screen items-center justify-center p-6">
        <FoldersToSpaces />
      </div>
    </AstryxTheme>
  )
}
