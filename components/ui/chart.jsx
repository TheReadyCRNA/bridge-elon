"use client";
import * as React from "react"
// Static import: recharts namespaces are used as JSX component types, which
// next/dynamic can't return. Consumers should next/dynamic this whole file.
// oxlint-disable-next-line emergent/prefer-dynamic-import
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = {
  light: "",
  dark: ".dark"
}

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({
  id,
  config
}) => {
  const colorConfig = Object.entries(config ?? {}).filter(([, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        // THEMES is a module-level const literal — provably non-null at this call site.
        // oxlint-disable-next-line emergent/safe-object-methods
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${(colorConfig ?? [])
.map(([key, itemConfig]) => {
const color =
  itemConfig.theme?.[theme] ||
  itemConfig.color
return color ? `  --color-${key}: ${color};` : null
})
.join("\n")}
}
`)
          .join("\n"),
      }} />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef((\n  {\n    active,\n    payload,\n    className,\n    indicator = \"dot\",\n    hideLabel = false,\n    hideIndicator = false,\n    label,\n    labelFormatter,\n    labelClassName,\n    formatter,\n    color,\n    nameKey,\n    labelKey,\n  },\n  ref\n) => {\n  const { config } = useChart()\n\n  const tooltipLabel = React.useMemo(() => {\n    if (hideLabel || !payload?.length) {\n      return null\n    }\n\n    const [item] = payload\n    const key = `${labelKey || item?.dataKey || item?.name || \"value\"}`\n    const itemConfig = getPayloadConfigFromPayload(config, item, key)\n    const value =\n      !labelKey && typeof label === \"string\"\n        ? config[label]?.label || label\n        : itemConfig?.label\n\n    if (labelFormatter) {\n      return (\n        <div className={cn(\"font-medium\", labelClassName)}>\n          {labelFormatter(value, payload)}\n        </div>\n      );\n    }\n\n    if (!value) {\n      return null\n    }\n\n    return <div className={cn(\"font-medium\", labelClassName)}>{value}</div>;\n  }, [\n    label,\n    labelFormatter,\n    payload,\n    hideLabel,\n    labelClassName,\n    config,\n    labelKey,\n  ])\n\n  if (!active || !payload?.length) {\n    return null\n  }\n\n  const nestLabel = payload.length === 1 && indicator !== \"dot\"\n\n  return (\n    <div\n      ref={ref}\n      className={cn(\n        \"grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl\",\n        className\n      )}>\n      {!nestLabel ? tooltipLabel : null}\n      <div className=\"grid gap-1.5\">\n        {(payload ?? []).map((item, index) => {\n          const key = `${nameKey || item.name || item.dataKey || \"value\"}`\n          const itemConfig = getPayloadConfigFromPayload(config, item, key)\n          const indicatorColor = color || item.payload.fill || item.color\n\n          return (\n            <div\n              key={item.dataKey}\n              className={cn(\n                \"flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground\",\n                indicator === \"dot\" && \"items-center\"\n              )}>\n              {formatter && item?.value !== undefined && item.name ? (\n                formatter(item.value, item.name, item, index, item.payload)\n              ) : (\n                <>\n                  {itemConfig?.icon ? (\n                    <itemConfig.icon />\n                  ) : (\n                    !hideIndicator && (\n                      <div\n                        className={cn(\"shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]\", {\n                          \"h-2.5 w-2.5\": indicator === \"dot\",\n                          \"w-1\": indicator === \"line\",\n                          \"w-0 border-[1.5px] border-dashed bg-transparent\":\n                            indicator === \"dashed\",\n                          \"my-0.5\": nestLabel && indicator === \"dashed\",\n                        })}\n                        style={\n                          {\n                            \"--color-bg\": indicatorColor,\n                            \"--color-border\": indicatorColor\n                          }\n                        } />\n                    )\n                  )}\n                  <div\n                    className={cn(\n                      \"flex flex-1 justify-between leading-none\",\n                      nestLabel ? \"items-end\" : \"items-center\"\n                    )}>\n                    <div className=\"grid gap-1.5\">\n                      {nestLabel ? tooltipLabel : null}\n                      <span className=\"text-muted-foreground\">\n                        {itemConfig?.label || item.name}\n                      </span>\n                    </div>\n                    {item.value && (\n                      <span className=\"font-mono font-medium tabular-nums text-foreground\">\n                        {item.value.toLocaleString()}\n                      </span>\n                    )}\n                  </div>\n                </>\n              )}\n            </div>\n          );\n        })}\n      </div>\n    </div>\n  );\n})\nChartTooltipContent.displayName = \"ChartTooltip\"\n\nconst ChartLegend = RechartsPrimitive.Legend\n\nconst ChartLegendContent = React.forwardRef((\n  { className, hideIcon = false, payload, verticalAlign = \"bottom\", nameKey },\n  ref\n) => {\n  const { config } = useChart()\n\n  if (!payload?.length) {\n    return null\n  }\n\n  return (\n    <div\n      ref={ref}\n      className={cn(\n        \"flex items-center justify-center gap-4\",\n        verticalAlign === \"top\" ? \"pb-3\" : \"pt-3\",\n        className\n      )}>\n      {(payload ?? []).map((item) => {\n        const key = `${nameKey || item.dataKey || \"value\"}`\n        const itemConfig = getPayloadConfigFromPayload(config, item, key)\n\n        return (\n          <div\n            key={item.value}\n            className={cn(\n              \"flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground\"\n            )}>\n            {itemConfig?.icon && !hideIcon ? (\n              <itemConfig.icon />\n            ) : (\n              <div\n                className=\"h-2 w-2 shrink-0 rounded-[2px]\"\n                style={{\n                  backgroundColor: item.color,\n                }} />\n            )}\n            {itemConfig?.label}\n          </div>\n        );\n      })}\n    </div>\n  );\n})\nChartLegendContent.displayName = \"ChartLegend\"\n\n// Helper to extract item config from a payload.\nfunction getPayloadConfigFromPayload(\n  config,\n  payload,\n  key\n) {\n  if (typeof payload !== \"object\" || payload === null) {\n    return undefined\n  }\n\n  const payloadPayload =\n    \"payload\" in payload &&\n    typeof payload.payload === \"object\" &&\n    payload.payload !== null\n      ? payload.payload\n      : undefined\n\n  let configLabelKey = key\n\n  if (\n    key in payload &&\n    typeof payload[key] === \"string\"\n  ) {\n    configLabelKey = payload[key]\n  } else if (\n    payloadPayload &&\n    key in payloadPayload &&\n    typeof payloadPayload[key] === \"string\"\n  ) {\n    configLabelKey = payloadPayload[key]\n  }\n\n  return configLabelKey in config\n    ? config[configLabelKey]\n    : config[key];\n}\n\nexport {\n  ChartContainer,\n  ChartTooltip,\n  ChartTooltipContent,\n  ChartLegend,\n  ChartLegendContent,\n  ChartStyle,\n}\n