"use client";
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef((
  {
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    ...props
  },
  ref
) => {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback((value) => {
    const openState = typeof value === "function" ? value(open) : value
    if (setOpenProp) {
      setOpenProp(openState)
    } else {
      _setOpen(openState)
    }

    // This sets the cookie to keep the sidebar state.
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }, [setOpenProp, open])

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile
      ? setOpenMobile((open) => !open)
      : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo(() => ({
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
  }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar])

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style
            }
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className
          )}
          ref={ref}
          {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
})
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef((\n  {\n    side = \"left\",\n    variant = \"sidebar\",\n    collapsible = \"offcanvas\",\n    className,\n    children,\n    ...props\n  },\n  ref\n) => {\n  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()\n\n  if (collapsible === \"none\") {\n    return (\n      <div\n        className={cn(\n          \"flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground\",\n          className\n        )}\n        ref={ref}\n        {...props}>\n        {children}\n      </div>\n    );\n  }\n\n  if (isMobile) {\n    return (\n      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>\n        <SheetContent\n          data-sidebar=\"sidebar\"\n          data-mobile=\"true\"\n          className=\"w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden\"\n          style={\n            {\n              \"--sidebar-width\": SIDEBAR_WIDTH_MOBILE\n            }\n          }\n          side={side}>\n          <SheetHeader className=\"sr-only\">\n            <SheetTitle>Sidebar</SheetTitle>\n            <SheetDescription>Displays the mobile sidebar.</SheetDescription>\n          </SheetHeader>\n          <div className=\"flex h-full w-full flex-col\">{children}</div>\n        </SheetContent>\n      </Sheet>\n    );\n  }\n\n  return (\n    <div\n      ref={ref}\n      className=\"group peer hidden text-sidebar-foreground md:block\"\n      data-state={state}\n      data-collapsible={state === \"collapsed\" ? collapsible : \"\"}\n      data-variant={variant}\n      data-side={side}>\n      {/* This is what handles the sidebar gap on desktop */}\n      <div\n        className={cn(\n          \"relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear\",\n          \"group-data-[collapsible=offcanvas]:w-0\",\n          \"group-data-[side=right]:rotate-180\",\n          variant === \"floating\" || variant === \"inset\"\n            ? \"group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]\"\n            : \"group-data-[collapsible=icon]:w-[--sidebar-width-icon]\"\n        )} />\n      <div\n        className={cn(\n          \"fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex\",\n          side === \"left\"\n            ? \"left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]\"\n            : \"right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]\",\n          // Adjust the padding for floating and inset variants.\n          variant === \"floating\" || variant === \"inset\"\n            ? \"p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]\"\n            : \"group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l\",\n          className\n        )}\n        {...props}>\n        <div\n          data-sidebar=\"sidebar\"\n          className=\"flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow\">\n          {children}\n        </div>\n      </div>\n    </div>\n  );\n})\nSidebar.displayName = \"Sidebar\"\n\nconst SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {\n  const { toggleSidebar } = useSidebar()\n\n  return (\n    <Button\n      ref={ref}\n      data-sidebar=\"trigger\"\n      variant=\"ghost\"\n      size=\"icon\"\n      className={cn(\"h-7 w-7\", className)}\n      onClick={(event) => {\n        onClick?.(event)\n        toggleSidebar()\n      }}\n      {...props}>\n      <PanelLeft />\n      <span className=\"sr-only\">Toggle Sidebar</span>\n    </Button>\n  );\n})\nSidebarTrigger.displayName = \"SidebarTrigger\"\n\nconst SidebarRail = React.forwardRef(({ className, ...props }, ref) => {\n  const { toggleSidebar } = useSidebar()\n\n  return (\n    <button\n      ref={ref}\n      data-sidebar=\"rail\"\n      aria-label=\"Toggle Sidebar\"\n      tabIndex={-1}\n      onClick={toggleSidebar}\n      title=\"Toggle Sidebar\"\n      className={cn(\n        \"absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex\",\n        \"[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize\",\n        \"[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize\",\n        \"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar\",\n        \"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2\",\n        \"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarRail.displayName = \"SidebarRail\"\n\nconst SidebarInset = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <main\n      ref={ref}\n      className={cn(\n        \"relative flex w-full flex-1 flex-col bg-background\",\n        \"md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarInset.displayName = \"SidebarInset\"\n\nconst SidebarInput = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <Input\n      ref={ref}\n      data-sidebar=\"input\"\n      className={cn(\n        \"h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarInput.displayName = \"SidebarInput\"\n\nconst SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <div\n      ref={ref}\n      data-sidebar=\"header\"\n      className={cn(\"flex flex-col gap-2 p-2\", className)}\n      {...props} />\n  );\n})\nSidebarHeader.displayName = \"SidebarHeader\"\n\nconst SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <div\n      ref={ref}\n      data-sidebar=\"footer\"\n      className={cn(\"flex flex-col gap-2 p-2\", className)}\n      {...props} />\n  );\n})\nSidebarFooter.displayName = \"SidebarFooter\"\n\nconst SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <Separator\n      ref={ref}\n      data-sidebar=\"separator\"\n      className={cn(\"mx-2 w-auto bg-sidebar-border\", className)}\n      {...props} />\n  );\n})\nSidebarSeparator.displayName = \"SidebarSeparator\"\n\nconst SidebarContent = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <div\n      ref={ref}\n      data-sidebar=\"content\"\n      className={cn(\n        \"flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarContent.displayName = \"SidebarContent\"\n\nconst SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {\n  return (\n    <div\n      ref={ref}\n      data-sidebar=\"group\"\n      className={cn(\"relative flex w-full min-w-0 flex-col p-2\", className)}\n      {...props} />\n  );\n})\nSidebarGroup.displayName = \"SidebarGroup\"\n\nconst SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {\n  const Comp = asChild ? Slot : \"div\"\n\n  return (\n    <Comp\n      ref={ref}\n      data-sidebar=\"group-label\"\n      className={cn(\n        \"flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0\",\n        \"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarGroupLabel.displayName = \"SidebarGroupLabel\"\n\nconst SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {\n  const Comp = asChild ? Slot : \"button\"\n\n  return (\n    <Comp\n      ref={ref}\n      data-sidebar=\"group-action\"\n      className={cn(\n        \"absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0\",\n        // Increases the hit area of the button on mobile.\n        \"after:absolute after:-inset-2 after:md:hidden\",\n        \"group-data-[collapsible=icon]:hidden\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarGroupAction.displayName = \"SidebarGroupAction\"\n\nconst SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    data-sidebar=\"group-content\"\n    className={cn(\"w-full text-sm\", className)}\n    {...props} />\n))\nSidebarGroupContent.displayName = \"SidebarGroupContent\"\n\nconst SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (\n  <ul\n    ref={ref}\n    data-sidebar=\"menu\"\n    className={cn(\"flex w-full min-w-0 flex-col gap-1\", className)}\n    {...props} />\n))\nSidebarMenu.displayName = \"SidebarMenu\"\n\nconst SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (\n  <li\n    ref={ref}\n    data-sidebar=\"menu-item\"\n    className={cn(\"group/menu-item relative\", className)}\n    {...props} />\n))\nSidebarMenuItem.displayName = \"SidebarMenuItem\"\n\nconst sidebarMenuButtonVariants = cva(\n  \"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0\",\n  {\n    variants: {\n      variant: {\n        default: \"hover:bg-sidebar-accent hover:text-sidebar-accent-foreground\",\n        outline:\n          \"bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]\",\n      },\n      size: {\n        default: \"h-8 text-sm\",\n        sm: \"h-7 text-xs\",\n        lg: \"h-12 text-sm group-data-[collapsible=icon]:!p-0\",\n      },\n    },\n    defaultVariants: {\n      variant: \"default\",\n      size: \"default\",\n    },\n  }\n)\n\nconst SidebarMenuButton = React.forwardRef((\n  {\n    asChild = false,\n    isActive = false,\n    variant = \"default\",\n    size = \"default\",\n    tooltip,\n    className,\n    ...props\n  },\n  ref\n) => {\n  const Comp = asChild ? Slot : \"button\"\n  const { isMobile, state } = useSidebar()\n\n  const button = (\n    <Comp\n      ref={ref}\n      data-sidebar=\"menu-button\"\n      data-size={size}\n      data-active={isActive}\n      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}\n      {...props} />\n  )\n\n  if (!tooltip) {\n    return button\n  }\n\n  if (typeof tooltip === \"string\") {\n    tooltip = {\n      children: tooltip,\n    }\n  }\n\n  return (\n    <Tooltip>\n      <TooltipTrigger asChild>{button}</TooltipTrigger>\n      <TooltipContent\n        side=\"right\"\n        align=\"center\"\n        hidden={state !== \"collapsed\" || isMobile}\n        {...tooltip} />\n    </Tooltip>\n  );\n})\nSidebarMenuButton.displayName = \"SidebarMenuButton\"\n\nconst SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {\n  const Comp = asChild ? Slot : \"button\"\n\n  return (\n    <Comp\n      ref={ref}\n      data-sidebar=\"menu-action\"\n      className={cn(\n        \"absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0\",\n        // Increases the hit area of the button on mobile.\n        \"after:absolute after:-inset-2 after:md:hidden\",\n        \"peer-data-[size=sm]/menu-button:top-1\",\n        \"peer-data-[size=default]/menu-button:top-1.5\",\n        \"peer-data-[size=lg]/menu-button:top-2.5\",\n        \"group-data-[collapsible=icon]:hidden\",\n        showOnHover &&\n          \"group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0\",\n        className\n      )}\n      {...props} />\n  );\n})\nSidebarMenuAction.displayName = \"SidebarMenuAction\"\n\nconst SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    data-sidebar=\"menu-badge\"\n    className={cn(\n      \"pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground\",\n      \"peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground\",\n      \"peer-data-[size=sm]/menu-button:top-1\",\n      \"peer-data-[size=default]/menu-button:top-1.5\",\n      \"peer-data-[size=lg]/menu-button:top-2.5\",\n      \"group-data-[collapsible=icon]:hidden\",\n      className\n    )}\n    {...props} />\n))\nSidebarMenuBadge.displayName = \"SidebarMenuBadge\"\n\nconst SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {\n  // Random width between 50 to 90%.\n  const width = React.useMemo(() => {\n    return `${Math.floor(Math.random() * 40) + 50}%`;\n  }, [])\n\n  return (\n    <div\n      ref={ref}\n      data-sidebar=\"menu-skeleton\"\n      className={cn(\"flex h-8 items-center gap-2 rounded-md px-2\", className)}\n      {...props}>\n      {showIcon && (\n        <Skeleton className=\"size-4 rounded-md\" data-sidebar=\"menu-skeleton-icon\" />\n      )}\n      <Skeleton\n        className=\"h-4 max-w-[--skeleton-width] flex-1\"\n        data-sidebar=\"menu-skeleton-text\"\n        style={\n          {\n            \"--skeleton-width\": width\n          }\n        } />\n    </div>\n  );\n})\nSidebarMenuSkeleton.displayName = \"SidebarMenuSkeleton\"\n\nconst SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => (\n  <ul\n    ref={ref}\n    data-sidebar=\"menu-sub\"\n    className={cn(\n      \"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5\",\n      \"group-data-[collapsible=icon]:hidden\",\n      className\n    )}\n    {...props} />\n))\nSidebarMenuSub.displayName = \"SidebarMenuSub\"\n\nconst SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => <li ref={ref} {...props} />)\nSidebarMenuSubItem.displayName = \"SidebarMenuSubItem\"\n\nconst SidebarMenuSubButton = React.forwardRef(\n  ({ asChild = false, size = \"md\", isActive, className, ...props }, ref) => {\n    const Comp = asChild ? Slot : \"a\"\n\n    return (\n      <Comp\n        ref={ref}\n        data-sidebar=\"menu-sub-button\"\n        data-size={size}\n        data-active={isActive}\n        className={cn(\n          \"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground\",\n          \"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground\",\n          size === \"sm\" && \"text-xs\",\n          size === \"md\" && \"text-sm\",\n          \"group-data-[collapsible=icon]:hidden\",\n          className\n        )}\n        {...props} />\n    );\n  }\n)\nSidebarMenuSubButton.displayName = \"SidebarMenuSubButton\"\n\nexport {\n  Sidebar,\n  SidebarContent,\n  SidebarFooter,\n  SidebarGroup,\n  SidebarGroupAction,\n  SidebarGroupContent,\n  SidebarGroupLabel,\n  SidebarHeader,\n  SidebarInput,\n  SidebarInset,\n  SidebarMenu,\n  SidebarMenuAction,\n  SidebarMenuBadge,\n  SidebarMenuButton,\n  SidebarMenuItem,\n  SidebarMenuSkeleton,\n  SidebarMenuSub,\n  SidebarMenuSubButton,\n  SidebarMenuSubItem,\n  SidebarProvider,\n  SidebarRail,\n  SidebarSeparator,\n  SidebarTrigger,\n  useSidebar,\n}
