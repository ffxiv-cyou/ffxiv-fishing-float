import uPlot, { type Plugin } from "uplot";

export class BoxesPlugin implements Plugin {
    gap = 2;
    shadowColor = "#000000";
    bodyColor = "#eee";
    medColor = "#000";
    bodyWidthFactor = 0.7;
    shadowWidth = 2;
    bodyOutline = 1;

    bodyColors: string[] = [];
    medColors: string[] = [];
    shadowColors: string[] = [];

    constructor(opts?: Partial<BoxesPlugin>) {
        Object.assign(this, opts);
    }

    hooks: uPlot.Hooks.ArraysOrFuncs = {
        draw: (u) => this.draw(u),
    }

    bodyColorForTugType(tugType: number) {
        return this.bodyColors[tugType] || this.bodyColor;
    }
    medColorForTugType(tugType: number) {
        return this.medColors[tugType] || this.medColor;
    }
    shadowColorForTugType(tugType: number) {
        return this.shadowColors[tugType] || this.shadowColor;
    }

    draw(u: uPlot) {
        u.ctx.save();

        const offset = (this.shadowWidth % 2) / 2;

        u.ctx.translate(offset, offset);

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
        const strokeRect = (x: number, y: number, width: number, height: number) => {
            x = Math.round(x);
            y = Math.round(y);
            width = Math.round(width);
            height = Math.round(height);
            if (flipXY) {
                u.ctx.strokeRect(y, x, height, width);
            } else {
                u.ctx.strokeRect(x, y, width, height);
            }
        }
        const line = (x1: number, y1: number, x2: number, y2: number) => {
            x1 = Math.round(x1);
            y1 = Math.round(y1);
            x2 = Math.round(x2);
            y2 = Math.round(y2);
            if (flipXY) {
                u.ctx.moveTo(y1, x1);
                u.ctx.lineTo(y2, x2);
            } else {
                u.ctx.moveTo(x1, y1);
                u.ctx.lineTo(x2, y2);
            }
        }

        // body rect
        let columnWidth = u.bbox.width / (u.scales.x.max! - u.scales.x.min!);
        if (flipXY) {
            columnWidth = u.bbox.height / (u.scales.x.max! - u.scales.x.min!);
        }
        let rows = u.data[0].length;
        for (let i = 0; i < rows; i++) {
            let med = u.data[1][i]!;
            let q1 = u.data[2][i]!;
            let q3 = u.data[3][i]!;
            let min = u.data[4][i]!;
            let max = u.data[5][i]!;
            let tugType = u.data[6][i] ?? 0;

            let timeAsX = u.valToPos(i, "x", true);
            let lowAsY = u.valToPos(min, "y", true);
            let highAsY = u.valToPos(max, "y", true);
            let openAsY = u.valToPos(q1, "y", true);
            let closeAsY = u.valToPos(q3, "y", true);
            let medAsY = u.valToPos(med, "y", true);

            let bodyColor = this.bodyColorForTugType(tugType);
            let medColor = this.medColorForTugType(tugType);
            let shadowColor = this.shadowColorForTugType(tugType);

            // shadow rect
            let shadowHeight = Math.max(highAsY, lowAsY) - Math.min(highAsY, lowAsY);
            let shadowX = timeAsX;
            let shadowY = Math.min(highAsY, lowAsY);

            u.ctx.beginPath();
            u.ctx.setLineDash([4, 4]);
            u.ctx.lineWidth = this.shadowWidth;
            u.ctx.strokeStyle = this.shadowColor;

            line(
                shadowX,
                shadowY,
                shadowX,
                shadowY + shadowHeight,
            );
            u.ctx.stroke();

            // Body rect
            let bodyWidth = Math.round(this.bodyWidthFactor * (columnWidth - this.gap));
            let bodyHeight = Math.max(closeAsY, openAsY) - Math.min(closeAsY, openAsY);
            let bodyX = timeAsX - (bodyWidth / 2);
            let bodyY = Math.min(closeAsY, openAsY);

            u.ctx.fillStyle = shadowColor;
            fillRect(
                bodyX,
                bodyY,
                bodyWidth,
                bodyHeight,
            );

            u.ctx.fillStyle = bodyColor;
            fillRect(
                bodyX + this.bodyOutline,
                bodyY + this.bodyOutline,
                bodyWidth - this.bodyOutline * 2,
                bodyHeight - this.bodyOutline * 2,
            );

            // median line
            u.ctx.fillStyle = medColor;
            fillRect(
                bodyX,
                medAsY - 1,
                bodyWidth,
                2,
            );

            // hz min/max whiskers
            u.ctx.beginPath();
            u.ctx.setLineDash([]);
            u.ctx.lineWidth = this.shadowWidth;
            u.ctx.strokeStyle = shadowColor;
            if (q3 !== max)
                line(bodyX, highAsY, bodyX + bodyWidth, highAsY);
            if (q1 !== min)
                line(bodyX, lowAsY, bodyX + bodyWidth, lowAsY);
            u.ctx.stroke();
        }

        u.ctx.translate(-offset, -offset);

        u.ctx.restore();
    }

    opts(u: uPlot, opts: uPlot.Options) {
        uPlot.assign(opts, {
            cursor: {
                points: {
                    show: false,
                }
            },
            scales: {
                y: {
                    range: (u: uPlot, dataMin: number, dataMax: number) => {
                        return uPlot.rangeNum(dataMin, dataMax, 0.1, true);
                    }
                }
            }
        });

        opts.series.forEach(series => {
            series.paths = () => null;
            series.points = { show: false };
        });
    }
}
