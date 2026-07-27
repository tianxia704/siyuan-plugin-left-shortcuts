"use strict";

const {Plugin, showMessage, openSetting} = require("siyuan");

const SHORTCUTS = Object.freeze([
    {
        id: "marketplace",
        icon: "iconBazaar",
        labelKey: "openMarketplace",
        fallback: "打开已下载插件",
    },
    {
        id: "settings",
        icon: "iconSettings",
        labelKey: "openSettings",
        fallback: "打开设置",
    },
]);

class LeftShortcuts extends Plugin {
    onload() {
        this.destroying = false;
        this.mountTimer = 0;
        this.observer = null;
        this.railStateCaptured = false;
        this.railWasHidden = false;
    }

    onLayoutReady() {
        this.mount();
        this.startObserver();
        window.setTimeout(() => this.mount(), 120);
    }

    onunload() {
        this.destroying = true;
        window.clearTimeout(this.mountTimer);
        this.observer?.disconnect();
        this.unmount();
    }

    t(key, fallback) {
        return this.i18n?.[key] || fallback;
    }

    getRail() {
        return document.getElementById("dockLeft");
    }

    getBottomContainer(rail) {
        return [...rail.children]
            .reverse()
            .find((element) => element.classList.contains("dock__items")) || null;
    }

    mount() {
        if (this.destroying) {
            return;
        }
        const rail = this.getRail();
        const container = rail && this.getBottomContainer(rail);
        if (!rail || !container) {
            this.queueMount();
            return;
        }

        if (!this.railStateCaptured) {
            this.railStateCaptured = true;
            this.railWasHidden = rail.classList.contains("fn__none");
        }

        for (const shortcut of SHORTCUTS) {
            const elementId = this.getElementId(shortcut.id);
            let element = document.getElementById(elementId);
            if (!element) {
                element = this.createShortcut(shortcut);
            }
            if (element.parentElement !== container) {
                container.append(element);
            }
        }

        rail.classList.remove("fn__none", "plugin-drawer-empty-dock-rail");
    }

    unmount() {
        for (const shortcut of SHORTCUTS) {
            document.getElementById(this.getElementId(shortcut.id))?.remove();
        }

        const rail = this.getRail();
        if (!rail || !this.railWasHidden) {
            return;
        }
        const hasVisibleDockItem = [...rail.querySelectorAll(".dock__item[data-type]")]
            .some((element) =>
                !element.classList.contains("fn__none") &&
                !element.classList.contains("plugin-drawer-own-dock-item") &&
                !element.classList.contains("plugin-drawer-managed-dock-item") &&
                !element.classList.contains("plugin-drawer-managed-native-dock")
            );
        if (!hasVisibleDockItem) {
            rail.classList.add("fn__none");
        }
    }

    getElementId(shortcutId) {
        return `${this.name}-${shortcutId}`;
    }

    createShortcut(shortcut) {
        const element = document.createElement("span");
        element.id = this.getElementId(shortcut.id);
        element.className = "dock__item ariaLabel plugin-left-shortcuts__item";
        element.dataset.type = `${this.name}:${shortcut.id}`;
        element.dataset.position = "east";
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute("aria-label", this.t(shortcut.labelKey, shortcut.fallback));
        element.innerHTML = `
            <svg aria-hidden="true">
                <use xlink:href="#${shortcut.icon}"></use>
            </svg>
        `;

        element.addEventListener("mousedown", (event) => {
            event.stopPropagation();
        }, true);
        element.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (shortcut.id === "marketplace") {
                this.openMarketplace();
            } else {
                this.openSettings();
            }
        }, true);
        element.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            element.click();
        });
        return element;
    }

    startObserver() {
        this.observer?.disconnect();
        this.observer = new MutationObserver((mutations) => {
            const rail = this.getRail();
            const needsMount =
                !rail ||
                rail.classList.contains("fn__none") ||
                SHORTCUTS.some((shortcut) =>
                    !document.getElementById(this.getElementId(shortcut.id))
                ) ||
                mutations.some((mutation) =>
                    mutation.type === "childList" &&
                    [...mutation.removedNodes].some((node) =>
                        node instanceof Element &&
                        (
                            node.id === "dockLeft" ||
                            node.matches?.(".plugin-left-shortcuts__item") ||
                            node.querySelector?.(".plugin-left-shortcuts__item")
                        )
                    )
                );
            if (needsMount) {
                this.queueMount();
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class"],
        });
    }

    queueMount() {
        if (this.destroying) {
            return;
        }
        window.clearTimeout(this.mountTimer);
        this.mountTimer = window.setTimeout(() => this.mount(), 60);
    }

    async openMarketplace() {
        try {
            // 官方用法：openSetting(app, "bazaar") 直接定位到集市标签，
            // 不依赖任何页面选择器或 DOM 轮询，适配各版本设置界面结构变化。
            openSetting(this.app, "bazaar");
        } catch (error) {
            console.error("[Left Shortcuts] 打开集市失败", error);
            this.notifyUnavailable("marketplaceUnavailable", "暂时无法打开集市");
        }
    }

    async openSettings() {
        try {
            // openSetting(app) 打开思源全局设置；
            // 注意：this.openSetting() 才是打开本插件自身设置，二者不可混用。
            openSetting(this.app);
        } catch (error) {
            console.error("[Left Shortcuts] 打开设置失败", error);
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
