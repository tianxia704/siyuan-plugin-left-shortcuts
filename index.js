"use strict";

const {Plugin, showMessage, openSetting} = require("siyuan");

const SHORTCUTS = Object.freeze([
    {
        id: "marketplace",
        type: "-marketplace",
        icon: "iconBazaar",
        labelKey: "openMarketplace",
        fallback: "打开已下载插件",
    },
    {
        id: "settings",
        type: "-settings",
        icon: "iconSettings",
        labelKey: "openSettings",
        fallback: "打开设置",
    },
]);

const DEFAULT_DOCK_SIZE = Object.freeze({
    width: 280,
    height: 260,
});

class LeftShortcuts extends Plugin {
    onload() {
        this.destroying = false;
        this.decorateTimer = 0;
        this.observer = null;
        this.handleDocumentClick = this.handleDocumentClick.bind(this);

        this.removeLegacyShortcuts();
        this.registerShortcuts();
        document.addEventListener("click", this.handleDocumentClick, true);
    }

    onLayoutReady() {
        this.decorateShortcuts();
        this.startObserver();
        window.setTimeout(() => this.decorateShortcuts(), 120);
    }

    onunload() {
        this.destroying = true;
        window.clearTimeout(this.decorateTimer);
        this.observer?.disconnect();
        document.removeEventListener("click", this.handleDocumentClick, true);
        this.getShortcutElements().forEach((element) => {
            element.classList.remove("plugin-left-shortcuts__item");
            element.removeAttribute("data-plugin-left-shortcut");
        });
    }

    t(key, fallback) {
        return this.i18n?.[key] || fallback;
    }

    removeLegacyShortcuts() {
        for (const shortcut of SHORTCUTS) {
            document.getElementById(`${this.name}-${shortcut.id}`)?.remove();
            document.querySelector(
                `.dock__item[data-type="${this.name}:${shortcut.id}"]`
            )?.remove();
        }
    }

    registerShortcuts() {
        SHORTCUTS.forEach((shortcut, index) => {
            this.addDock({
                config: {
                    position: "LeftBottom",
                    size: {...DEFAULT_DOCK_SIZE},
                    icon: shortcut.icon,
                    title: this.t(shortcut.labelKey, shortcut.fallback),
                    index: 1000 + index,
                    show: false,
                },
                data: {
                    shortcutId: shortcut.id,
                },
                type: shortcut.type,
                init(dock) {
                    dock.element.classList.add("plugin-left-shortcuts__empty-panel");
                    dock.element.replaceChildren();
                },
            });
        });
    }

    getDockType(shortcut) {
        return `${this.name}${shortcut.type}`;
    }

    getShortcutElements() {
        const dockTypes = new Set(SHORTCUTS.map((shortcut) =>
            this.getDockType(shortcut)
        ));
        return [...document.querySelectorAll(".dock .dock__item[data-type]")]
            .filter((element) => dockTypes.has(element.dataset.type));
    }

    getShortcutByElement(element) {
        if (!element) {
            return null;
        }
        return SHORTCUTS.find((shortcut) =>
            element.dataset.type === this.getDockType(shortcut)
        ) || null;
    }

    decorateShortcuts() {
        if (this.destroying) {
            return;
        }
        for (const element of this.getShortcutElements()) {
            const shortcut = this.getShortcutByElement(element);
            if (!shortcut) {
                continue;
            }
            element.id = `${this.name}-${shortcut.id}`;
            element.classList.add("plugin-left-shortcuts__item");
            element.dataset.pluginLeftShortcut = shortcut.id;
            element.setAttribute(
                "aria-label",
                this.t(shortcut.labelKey, shortcut.fallback)
            );
        }
    }

    handleDocumentClick(event) {
        if (this.destroying || event.button !== 0) {
            return;
        }
        const target = event.target instanceof Element
            ? event.target.closest(".dock__item[data-type]")
            : null;
        const shortcut = this.getShortcutByElement(target);
        if (!shortcut) {
            return;
        }

        // Keep the entry registered as a native dock item so SiYuan can move
        // and persist it, but replace the normal panel toggle with an action.
        event.preventDefault();
        event.stopImmediatePropagation();
        target.classList.remove("dock__item--active", "dock__item--activefocus");

        if (shortcut.id === "marketplace") {
            this.openMarketplace();
        } else {
            this.openSettings();
        }
    }

    startObserver() {
        this.observer?.disconnect();
        this.observer = new MutationObserver((mutations) => {
            const changed = mutations.some((mutation) =>
                mutation.type === "childList" &&
                (
                    mutation.addedNodes.length > 0 ||
                    mutation.removedNodes.length > 0
                )
            );
            if (changed) {
                this.queueDecoration();
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    queueDecoration() {
        if (this.destroying) {
            return;
        }
        window.clearTimeout(this.decorateTimer);
        this.decorateTimer = window.setTimeout(
            () => this.decorateShortcuts(),
            60
        );
    }

    openMarketplace() {
        try {
            openSetting(this.app, "bazaar");
        } catch (error) {
            console.error("[Left Shortcuts] Failed to open marketplace", error);
            this.notifyUnavailable(
                "marketplaceUnavailable",
                "暂时无法打开集市"
            );
        }
    }

    openSettings() {
        try {
            openSetting(this.app);
        } catch (error) {
            console.error("[Left Shortcuts] Failed to open settings", error);
            this.notifyUnavailable("settingsUnavailable", "暂时无法打开设置");
        }
    }

    notifyUnavailable(key, fallback) {
        const message = this.t(key, fallback);
        if (typeof showMessage === "function") {
            showMessage(message);
        } else {
            console.warn(`[Left Shortcuts] ${message}`);
        }
    }
}

module.exports = LeftShortcuts;
