import {
  ArrowRightLeft,
  FolderInput,
  Keyboard,
  MessageSquare,
  Settings
} from "lucide-react"
import { browser } from "wxt/browser"

import { Menu, type MenuItems } from "../menu/menu"

const FEEDBACK_URL = "https://usecarrel.app/support"

const openTab = (url: string) => void browser.tabs.create({ url })

const items: MenuItems = [
  {
    label: "Turn folders into spaces…",
    icon: <FolderInput size={16} />,
    onClick: () => openTab(chrome.runtime.getURL("/folders-to-spaces.html"))
  },
  {
    label: "Import from Arc…",
    icon: <ArrowRightLeft size={16} />,
    onClick: () => openTab(chrome.runtime.getURL("/import-arc.html"))
  },
  {
    label: "Keyboard shortcut…",
    icon: <Keyboard size={16} />,
    onClick: () => openTab("chrome://extensions/shortcuts")
  },
  { type: "divider" },
  {
    label: "Send feedback",
    icon: <MessageSquare size={16} />,
    onClick: () => openTab(FEEDBACK_URL)
  }
]

export function SettingsMenu() {
  return (
    <Menu
      label="Settings"
      icon={<Settings size={18} className="text-gray-500 dark:text-gray-400" />}
      items={items}
      className="min-w-52"
    />
  )
}
