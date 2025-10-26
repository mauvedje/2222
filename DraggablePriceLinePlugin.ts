import { type IChartApi, type ISeriesApi, type MouseEventParams } from "lightweight-charts";

export interface DraggablePriceLineOptions {
  price: number;
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
  label?: string;
  onPriceChange?: (price: number) => void;
  onDragEnd?: (price: number) => void;
}

export class DraggablePriceLinePlugin {
  private chart: IChartApi;
  private series: ISeriesApi<"Candlestick">;
  private options: Required<DraggablePriceLineOptions>;
  private isDragging = false;
  private isHovering = false;
  private priceLine: any = null;
  private chartContainer: HTMLElement;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<"Candlestick">,
    options: DraggablePriceLineOptions
  ) {
    this.chart = chart;
    this.series = series;
    this.chartContainer = chart.chartElement();
    this.options = {
      price: options.price,
      color: options.color || "#dc2626",
      lineWidth: options.lineWidth || 2,
      lineStyle: options.lineStyle || 0,
      label: options.label || "",
      onPriceChange: options.onPriceChange || (() => {}),
      onDragEnd: options.onDragEnd || (() => {}),
    };

    this.init();
  }

  private init() {
    this.updatePriceLine();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Chart mouse events
    this.chart.subscribeCrosshairMove(this.handleCrosshairMove.bind(this));

    // Canvas mouse events for dragging
    this.chartContainer.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.chartContainer.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.chartContainer.addEventListener(
      "mouseup",
      this.handleMouseUp.bind(this)
    );
    this.chartContainer.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );
  }

  private updatePriceLine() {
    if (this.priceLine) {
      this.series.removePriceLine(this.priceLine);
    }

    this.priceLine = this.series.createPriceLine({
      price: this.options.price,
      color: this.options.color,
      //@ts-ignore
      lineWidth: this.options.lineWidth ,
      lineStyle: this.options.lineStyle,
      axisLabelVisible: true,
      title: this.options.label,
    });
  }

  private handleCrosshairMove(param: MouseEventParams) {
    if (this.isDragging || !param.point) return;

    const priceCoordinate = this.series.priceToCoordinate(this.options.price);
    if (priceCoordinate === null) return;

    const distance = Math.abs(param.point.y - priceCoordinate);
    const wasHovering = this.isHovering;
    this.isHovering = distance <= 8;

    if (this.isHovering !== wasHovering) {
      this.chartContainer.style.cursor = this.isHovering ? "grab" : "default";
    }
  }

  private handleMouseDown(event: MouseEvent) {
    if (!this.isHovering) return;

    this.isDragging = true;
    this.chartContainer.style.cursor = "grabbing";

    // Disable chart interactions
    this.chart.applyOptions({
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
    });

    event.preventDefault();
    event.stopPropagation();
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const rect = this.chartContainer.getBoundingClientRect();
    const y = event.clientY - rect.top;

    const newPrice = this.series.coordinateToPrice(y);
    if (newPrice !== null && newPrice > 0) {
      this.setPrice(newPrice, false);
    }

    event.preventDefault();
    event.stopPropagation();
  }

  private handleMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;

    this.options.onDragEnd(this.options.price);

    // Re-enable chart interactions
    this.chart.applyOptions({
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Force re-check hover state after drag ends
    setTimeout(() => {
      const rect = this.chartContainer.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const priceCoordinate = this.series.priceToCoordinate(this.options.price);

      if (priceCoordinate !== null) {
        const distance = Math.abs(y - priceCoordinate);
        this.isHovering = distance <= 8;
        this.chartContainer.style.cursor = this.isHovering ? "grab" : "default";
      } else {
        this.isHovering = false;
        this.chartContainer.style.cursor = "default";
      }
    }, 10);
  }

  private handleMouseLeave() {
    if (this.isDragging) {
      this.handleMouseUp(new MouseEvent("mouseup"));
    }
    this.isHovering = false;
    this.chartContainer.style.cursor = "default";
  }

  public setPrice(price: number, fromDrag = false) {
    this.options.price = price;
    this.updatePriceLine();
    this.options.onPriceChange(price);
    if (fromDrag) {
      this.options.onDragEnd(price);
    }
  }

  public getPrice(): number {
    return this.options.price;
  }

  public setColor(color: string) {
    this.options.color = color;
    this.updatePriceLine();
  }

  public destroy() {
    if (this.priceLine) {
      this.series.removePriceLine(this.priceLine);
    }

    // Remove event listeners
    this.chartContainer.removeEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.chartContainer.removeEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.chartContainer.removeEventListener(
      "mouseup",
      this.handleMouseUp.bind(this)
    );
    this.chartContainer.removeEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );

    this.chartContainer.style.cursor = "default";
  }
}