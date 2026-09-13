import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { CASE_STUDY_SEQUENCE } from "./caseProgress";

export const list = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let studies;
    if (args.category && args.category !== "All") {
      studies = await ctx.db
        .query("caseStudies")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      studies = await ctx.db.query("caseStudies").collect();
    }

    // Sort by index "01", "02", ...
    return studies.sort((a, b) => a.index.localeCompare(b.index, undefined, { numeric: true }));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    caseStudy: v.any(),
  },
  handler: async (ctx, args) => {
    const study = args.caseStudy;
    if (!study.slug || !study.index || !study.title) {
      throw new Error("Invalid case study: missing required slug, index, or title");
    }

    const existing = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", study.slug))
      .unique();

    const seqMeta = CASE_STUDY_SEQUENCE.find((c) => c.slug === study.slug);
    const resolvedTier = seqMeta
      ? seqMeta.tier
      : (study.tier ?? (Number(study.index) <= 3 ? "free" : "premium"));
    const resolvedRcCost =
      resolvedTier === "free"
        ? 0
        : study.rcCost !== undefined && study.rcCost > 0
          ? study.rcCost
          : 50;

    const record = {
      slug: study.slug,
      index: study.index,
      title: study.title,
      shortTitle: study.shortTitle ?? study.title,
      category: study.category ?? "Foundations (OOP)",
      subcategory: study.subcategory ?? "",
      difficulty: study.difficulty ?? "Beginner",
      learnerLevel: study.learnerLevel ?? "Explorer",
      estimatedTime: study.estimatedTime ?? "30-45 minutes",
      minutes: study.minutes ?? 40,
      status: study.status ?? "published",
      tier: resolvedTier,
      rcCost: resolvedRcCost,
      summary: study.summary ?? "",
      learningObjectives: study.learningObjectives ?? [],
      prerequisites: study.prerequisites ?? [],
      engineeringConcepts: study.engineeringConcepts ?? [],
      technologies: study.technologies ?? [],
      tech: study.tech ?? [],
      tags: study.tags ?? [],
      glossary: study.glossary,
      primers: study.primers,
      discover: study.discover,
      understand: study.understand,
      concepts: study.concepts,
      architecture: study.architecture,
      decisions: study.decisions,
      tradeOffs: study.tradeOffs,
      implementation: study.implementation,
      practice: study.practice,
      failureModes: study.failureModes,
      microDrills: study.microDrills,
      reflection: study.reflection,
      techNotes: study.techNotes,
      codeLab: study.codeLab,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, record);
      return { id: existing._id, action: "updated", slug: study.slug };
    } else {
      const id = await ctx.db.insert("caseStudies", record);
      return { id, action: "inserted", slug: study.slug };
    }
  },
});
