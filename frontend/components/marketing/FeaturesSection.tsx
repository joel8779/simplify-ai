"use client";

import { motion } from "framer-motion";
import {
  Brain,
  FileSearch,
  Lock,
  MessageSquare,
  Zap,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Conversational RAG",
    description:
      "Ask natural questions and get answers grounded in your uploaded documents with inline citations.",
  },
  {
    icon: FileSearch,
    title: "Smart retrieval",
    description:
      "Hybrid search across chunks, metadata, and embeddings for precise context every time.",
  },
  {
    icon: Brain,
    title: "Multi-model support",
    description:
      "Switch between leading LLMs without changing your workflow or losing conversation history.",
  },
  {
    icon: Layers,
    title: "Workspace organization",
    description:
      "Group documents, sessions, and teams in a single dashboard built for scale.",
  },
  {
    icon: Lock,
    title: "Enterprise security",
    description:
      "Role-based access, audit logs, and data isolation designed for production deployments.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    description:
      "Token-by-token answers with stop controls and real-time source highlighting.",
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-[4.5rem] border-t border-border/40 px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need for{" "}
            <span className="gradient-text">document intelligence</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Production-ready RAG workflows without the infrastructure headache.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="h-full border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/60">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
