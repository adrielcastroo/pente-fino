import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { NAV, ALL_KEYS } from './navData';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminSidebarWrapper({ activeKey, onSelect }: { activeKey: string; onSelect: (k: string) => void }) {
  const navigate = useNavigate();
  const activeSection = NAV.find((s) => s.items.some((i) => i.key === activeKey));

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
      aria-label="Menu Painel Admin"
    >
        <SidebarHeader className="overflow-hidden py-4 px-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-7 w-7" />
            <div className="flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-opacity hover:opacity-80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-bold leading-tight tracking-tight text-sidebar-accent-foreground truncate">
                Pente Fino
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="custom-scrollbar overflow-x-hidden px-3">
          {NAV.map((section) => {
            const SecIcon = section.icon;
            const isSectionActive = activeSection?.key === section.key;
            return (
              <SidebarGroup key={section.key} className="mb-2 p-0 shrink-0">
                <div
                  data-sidebar="module-group-label"
                  className="flex h-8 shrink-0 items-center px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50"
                >
                  <SecIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  {section.label}
                </div>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeKey === item.key;
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            size="lg"
                            onClick={() => onSelect(item.key)}
                            isActive={isActive}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'relative h-10 rounded-md transition-colors duration-150 active:scale-[0.97]',
                              isActive
                                ? 'font-bold text-primary'
                                : 'font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                          >
                            {isActive && (
                              <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                            )}
                            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                              <ItemIcon
                                className="h-[18px] w-[18px]"
                                strokeWidth={isActive ? 2.4 : 1.75}
                              />
                            </div>
                            <span className="min-w-0 flex-1 truncate text-left text-[13px]">
                              {item.label}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="overflow-hidden border-t border-border/30 py-3 px-3">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => navigate('/')}
                tooltip="Voltar ao app"
                aria-label="Voltar ao app"
                className="relative h-10 rounded-md text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </div>
                <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                  Voltar ao app
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}