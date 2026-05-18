"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  MessageSquarePlus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/navigation";
import { chatService, type ChatStatsResponse } from "@/lib/services/chat.service";

const QUICK_ACTIONS = [
  {
    title: "New chat",
    description: "Start a conversation grounded in your documents.",
    href: ROUTES.chat,
    icon: MessageSquarePlus,
  },
  {
    title: "Upload documents",
    description: "Add PDFs and files to your knowledge base.",
    href: ROUTES.documents,
    icon: Upload,
  },
] as const;

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<ChatStatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const response = await chatService.getStats();
        if (!cancelled) {
          setStats(response);
        }
      } catch (error) {
        if (!cancelled) {
          setStatsError(
            error instanceof Error ? error.message : "Failed to load stats"
          );
        }
      }
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    {
      label: "Active chats",
      value: stats ? String(stats.total_chats) : statsError ? "--" : "...",
      icon: MessageSquare,
    },
    {
      label: "Documents",
      value: stats ? String(stats.total_documents) : statsError ? "--" : "...",
      icon: FileText,
    },
    {
      label: "Total messages",
      value: stats ? String(stats.total_messages) : statsError ? "--" : "...",
      icon: MessageSquarePlus,
    },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          {QUICK_ACTIONS.map((action) => (
            <Card
              key={action.title}
              className="group border-border/50 bg-card/50 transition-colors hover:border-primary/30"
            >
              <CardHeader>
                <action.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="gap-2 px-0" asChild>
                  <Link href={action.href}>
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
