import uPlot, { type Plugin } from "uplot";
import { mount } from 'svelte';
import Tooltip from "./tooltip.svelte";

export class TooltipPlugin implements Plugin {
    className: string = "";
    style: Partial<CSSStyleDeclaration> = {};

    opts?: ((self: uPlot, opts: uPlot.Options) => void | uPlot.Options) | undefined;
    hooks: uPlot.Hooks.ArraysOrFuncs = {
        init: (u, opts) => this.init(u, opts),
        setCursor: (u) => this.setCursor(u),
        setSize: (u) => this.setSize(u),
        destroy: (u) => {
            if (this.overlayEl) {
                this.overlayEl.remove();
                this.overlayEl = null;
                this.tooltip = null;
            }
        }
    };

    overlayEl: HTMLDivElement | null = null;
    overEl: HTMLDivElement | null = null;
    tooltip: Tooltip | null = null;
    bLeft = 0;
    bTop = 0;
    bWidth = 0;
    bHeight = 0;
    props: any;
    elementID: string;

    constructor(componentProps: any, opts?: Partial<TooltipPlugin>) {
        Object.assign(this, opts);

        this.elementID = `tooltip-${Math.random().toString(36).substring(2, 8)}`;
        this.props = componentProps;
    }

    createOverlayEl(root: HTMLElement) {
        let overlay = document.getElementById(this.elementID) as HTMLDivElement;
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = this.elementID;
            overlay.style.position = "absolute";
            overlay.style.zIndex = "1";
            document.body.appendChild(overlay);
            root.appendChild(overlay);
        }
        this.tooltip = mount(Tooltip, {
            target: overlay,
            props: this.props,
        });
        return overlay;
    }

    init(u: uPlot, opts: uPlot.Options) {
        this.overEl = u.over;

        if (!this.overlayEl) {
            this.overlayEl = this.createOverlayEl(u.root);
        }

        this.overEl.onmouseenter = () => {
            if (this.overlayEl) {
                this.overlayEl.style.display = "block";
            }
        };

        this.overEl.onmouseleave = () => {
            if (this.overlayEl) {
                this.overlayEl.style.display = "none";
            }
        };
    }
    setCursor(u: uPlot) {
        if (!this.overlayEl) {
            this.overlayEl = document.getElementById("overlay") as HTMLDivElement;
        }

        const { left, top, idx } = u.cursor;
        if (!this.overlayEl || idx === null || idx === undefined || left === undefined || top === undefined) {
            return;
        }

        const x = u.posToVal(left, "y");

        let anchor = { left: left + this.bLeft + 10, top: top + this.bTop + 10 };
        if (left + this.overlayEl.clientWidth > this.bWidth) {
            anchor.left = left + this.bLeft - this.overlayEl.clientWidth - 10;
        }

        this.overlayEl!.style.left = `${anchor.left}px`;
        this.overlayEl!.style.top = `${anchor.top}px`;

        if (this.tooltip) {
            this.tooltip.updateIdx(u, idx);
            this.tooltip.updateVal(u, x);
        }

    }
    setSize(u: uPlot) {
        let bbox = u.over.getBoundingClientRect();
        this.bLeft = u.over.offsetLeft;
        this.bTop = u.over.offsetTop;
        this.bWidth = bbox.width;
        this.bHeight = bbox.height;
    }
}
