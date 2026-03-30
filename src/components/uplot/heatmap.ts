import uPlot, { type Plugin } from "uplot";

export class HeatmapPlugin implements Plugin {
    bodyWidthFactor = 0.7;
    gap = 2;
    bucketIncr: number;
    colors: string[] = [];

    constructor(incr: number, opts?: Partial<HeatmapPlugin>) {
        this.bucketIncr = incr;
        Object.assign(this, opts);
    }

    opts?: ((self: uPlot, opts: uPlot.Options) => void | uPlot.Options) | undefined;
    hooks: uPlot.Hooks.ArraysOrFuncs = {
        draw: (u) => this.draw(u),
    };

    fillStyle(tugType: number, count: number, minCount: number, maxCount: number) {
        const percent = count / maxCount;
        
        if (this.colors[tugType]) {
            const baseColor = this.colors[tugType];
            const oklckMatch = /oklch\(([\d.]+)% ([\d.]*) ([\d.]+)(?: \/ ([\d.]+))?\)/;

            const match = oklckMatch.exec(baseColor);
            if (match) {
                const [lightness, chroma, hue] = match.slice(1).map((v) => parseFloat(v));
                const newChroma = percent === 0 ? 0 : chroma * (percent * 0.6 + 0.4);
                return `oklch(${lightness}% ${newChroma} ${hue})`;
            } else {
                console.warn(`Color ${baseColor} is not in oklch format. Falling back to default color.`);
            }
        }

        if (count === 0) {
            return "oklch(80% 0.1 180 / 0.5)";
        }
        return `oklch(75% 0.12 ${180 - percent * 90})`;
    }

    draw(u: uPlot) {
        const { ctx, data } = u;

        const flipXY = u.scales.x.ori === 1;
        const fillRect = (x: number, y: number, width: number, height: number) => {
            x = Math.round(x);
            y = Math.round(y);
            width = Math.round(width);
            height = Math.round(height);
            if (flipXY) {
                u.ctx.fillRect(y, x, height, width);
            } else {
                u.ctx.fillRect(x, y, width, height);
            }
        };
        

        /**
         * data[0] = x values (start of each bucket)
         * data[1] = begin time
         * data[2] = tug type
         * data[3] = bucket[0]
         * data[4] = bucket[1]
         * ...
         */

        let columnWidth = u.bbox.width / (u.scales.x.max! - u.scales.x.min!);
        if (flipXY) {
            columnWidth = u.bbox.height / (u.scales.x.max! - u.scales.x.min!);
        }
        let bodyWidth = Math.round(this.bodyWidthFactor * (columnWidth - this.gap));

        ctx.save()
        ctx.beginPath();
        ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
        ctx.clip();

        data[0].forEach((x, xi) => {
            let xPos = Math.floor(u.valToPos(x, 'x', true));
            let bucket = data[3 + xi] as number[];
            let yBegin = data[1][xi] as number;
            let tugType = data[2][xi] as number;
            let maxCount = bucket.reduce((acc, val) => Math.max(val, acc), -Infinity);

            bucket.forEach((count, yi) => {
                let yPos = Math.floor(u.valToPos(yi * this.bucketIncr + yBegin, 'y', true));
                let nextYPos = Math.floor(u.valToPos((yi + 1) * this.bucketIncr + yBegin, 'y', true));
                let yHgt = nextYPos - yPos;
                ctx.fillStyle = this.fillStyle(tugType, count, 1, maxCount);
                fillRect(xPos - Math.floor(bodyWidth / 2), yPos, bodyWidth, yHgt);
            });
        });

        ctx.restore()
    }
}
