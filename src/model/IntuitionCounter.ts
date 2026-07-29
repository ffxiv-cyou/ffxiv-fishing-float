import { createSubscriber } from "svelte/reactivity";
import type { ItemCount } from "./GameDB";

class IntuitionCount implements ItemCount {
    item: number;
    count: number;
    thresold: number;

    #subscribe;
    update: (() => void) | null = null;

    constructor(item: number, count: number, thresold: number) {
        this.item = item;
        this.count = count;
        this.thresold = thresold;

        this.#subscribe = createSubscriber((update) => {
            this.update = update;
        })
    }

    get Count() {
        this.#subscribe();
        return this.count;
    }

    get Thresold() {
        this.#subscribe();
        return this.thresold;
    }

    set Thresold(value: number) {
        this.thresold = value;
        this.tryUpdate();
    }

    tryUpdate() {
        if (this.update) {
            this.update();
        }
    }

    add(count: number) {
        this.count += count;
        this.tryUpdate();
    }

}

/**
 * 鱼识计数器
 */
export class IntuitionCounter {
    filter: ItemCount[] | undefined = [];
    count: IntuitionCount[] = [];
    
    intuitionTriggered: boolean = false;
    intuitionTriggerAt: number = 0;
    intuitionDuration: number = 0;

    #subscribe;
    update: (() => void) | null = null;
    
    constructor() {
        this.#subscribe = createSubscriber((update) => {
            this.update = update;
        })
    }

    get Count() {
        this.#subscribe();
        return this.count;
    }

    get ConditionKnown() {
        this.#subscribe();
        return (this.filter?.length ?? 0) > 0;
    }

    /**
     * 鱼识剩余时间
     */
    get IntuitionDuration() {
        this.#subscribe();
        if (!this.intuitionTriggered)
            return 0;

        var elapsed = (Date.now() - this.intuitionTriggerAt) / 1000;
        return Math.max(0, this.intuitionDuration - elapsed);
    }

    tryUpdate() {
        if (this.update) {
            this.update();
        }
    }

    /**
     * 设置计数器的过滤器
     * @param filter 当传入空数组，说明不知道怎么触发；传入 undefined 则没有鱼识
     * @returns 
     */
    setFilter(filter: ItemCount[] | undefined) {
        this.filter = filter;

        if (this.filter === undefined) {
            this.count = [];
            return;
        }

        this.count.forEach(c => {
            const match = this.filter!.find(f => f.item === c.item);
            if (match) {
                c.Thresold = match.count;
            } 
        });

        this.filter!.forEach(f => {
            const existing = this.count.find(c => c.item === f.item);
            if (!existing) {
                this.count.push(new IntuitionCount(f.item, 0, f.count));
            }
        });

        if (this.filter.length > 0) {
            this.count = this.count.filter(c => {
                const match = this.filter!.find(f => f.item === c.item);
                return match != null;
            });
        }

        this.tryUpdate();
    }

    setIntuitionTriggered(duration: number, epoch: number) {
        this.intuitionTriggered = true;
        this.intuitionDuration = duration;
        this.intuitionTriggerAt = Date.now();
    }

    addFish(fishId: number, count: number) {
        if (this.intuitionTriggered || this.filter === undefined) {
            console.log("intuition already triggered or no intuition, ignoring", fishId, count);
            return;
        }

        let thresold = 0;
        if (this.filter.length > 0) {
            const match = this.filter.find(f => f.item === fishId);
            if (!match)
                return;

            thresold = match.count;
        }

        const existing = this.count.find(f => f.item === fishId);
        if (existing) {
            existing.add(count);
        } else {
            this.count.push(new IntuitionCount(fishId, count, thresold));
        }
        console.log("adding fish to intuition counter", fishId, count, thresold, this.count);

        this.tryUpdate();
    }

    reset() {
        console.log("resetting intuition counter");
        this.count = [];
        this.intuitionTriggered = false;
        this.intuitionTriggerAt = 0;
        this.intuitionDuration = 0;
        this.tryUpdate();
    }
}