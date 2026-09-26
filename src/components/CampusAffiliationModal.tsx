import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CURATED_UNIVERSITIES } from "@/data/universities";
import { toast } from "sonner";
import { Check, GraduationCap, Loader2, School, Search, X } from "lucide-react";

interface CampusAffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUniversity?: string;
  onSuccess?: (university: string) => void;
}

export function CampusAffiliationModal({
  isOpen,
  onClose,
  currentUniversity = "",
  onSuccess,
}: CampusAffiliationModalProps) {
  const [selectedUni, setSelectedUni] = useState(currentUniversity);
  const [customInput, setCustomInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateUniversity = useMutation(api.users.updateUniversity);

  // List of campuses excluding "All Campuses"
  const selectableCampuses = useMemo(() => {
    return CURATED_UNIVERSITIES.filter((u) => u !== "All Campuses");
  }, []);

  const filteredCampuses = useMemo(() => {
    if (!searchFilter.trim()) return selectableCampuses;
    const q = searchFilter.toLowerCase();
    return selectableCampuses.filter((u) => u.toLowerCase().includes(q));
  }, [selectableCampuses, searchFilter]);

  if (!isOpen) return null;

  async function handleSave(nameToSave: string) {
    const trimmed = nameToSave.trim();
    if (!trimmed) {
      toast.error("Please enter or select a valid university or college name");
      return;
    }

    setIsSaving(true);
    try {
      await updateUniversity({ university: trimmed });
      toast.success(
        trimmed === "Independent / Self-Taught"
          ? "Campus affiliation set to Independent / Self-Taught"
          : `Affiliated with ${trimmed}! Your cases now count toward campus rankings.`,
      );
      onSuccess?.(trimmed);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update university");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setIsSaving(true);
    try {
      await updateUniversity({ university: "Independent / Self-Taught" });
      toast.success("Affiliation reset to Independent / Self-Taught");
      onSuccess?.("Independent / Self-Taught");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update university");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div
        className="w-full max-w-xl rounded-3xl border-2 border-black bg-white p-6 shadow-[0_12px_0_0_#000] text-black relative flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-black text-white shrink-0">
              <GraduationCap className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black bg-neutral-100 border border-black/20 px-2 py-0.5 rounded">
                  Campus Affiliation
                </span>
                {currentUniversity && currentUniversity !== "Independent / Self-Taught" && (
                  <span className="font-mono text-[10px] text-neutral-600 font-bold truncate max-w-[20ch]">
                    Current: {currentUniversity}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-black mt-0.5">
                Update University / College
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-black/20 hover:bg-neutral-100 text-black transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          <p className="text-xs text-neutral-600 font-medium leading-relaxed">
            Represent your campus in the{" "}
            <strong className="text-black">University Leaderboard & Inter-Campus Cup</strong>. Every
            distributed system investigation you clear adds to your college&apos;s cumulative
            standing.
          </p>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search popular universities..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-2xl bg-neutral-50 border-2 border-black pl-10 pr-4 py-2.5 text-xs font-semibold text-black placeholder:text-neutral-400 outline-none focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Select Grid */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 font-black mb-2">
              Select Your Campus:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1 border border-black/10 rounded-2xl bg-neutral-50/50">
              {filteredCampuses.map((uni) => {
                const isSelected = selectedUni === uni;
                return (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => {
                      setSelectedUni(uni);
                      setCustomInput("");
                    }}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-bold border-2 transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-black text-white border-black shadow-xs scale-[1.02]"
                        : "bg-white hover:bg-neutral-100 text-black border-black/20 hover:border-black"
                    }`}
                  >
                    {isSelected && <Check className="size-3 text-white stroke-[3]" />}
                    <span>{uni}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-3.5 space-y-2">
            <label
              htmlFor="custom-university-input"
              className="block font-mono text-[10px] uppercase tracking-wider text-black font-black"
            >
              Don&apos;t see your college? Type custom name:
            </label>
            <div className="flex gap-2">
              <input
                id="custom-university-input"
                type="text"
                placeholder="e.g. Stanford University, IIT Kharagpur, BITS Hyderabad..."
                value={customInput}
                maxLength={80}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedUni("");
                  }
                }}
                className="flex-1 rounded-xl bg-white border-2 border-black px-3.5 py-2 text-xs font-medium text-black outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
            <p className="font-mono text-[9px] text-neutral-500">
              Maximum 80 characters. Visible on your public profile and campus leaderboard.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-5 pt-4 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="text-xs font-mono font-bold text-neutral-500 hover:text-black hover:underline disabled:opacity-50 cursor-pointer"
          >
            Clear / Set Independent
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border-2 border-black bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(customInput || selectedUni)}
              disabled={(!customInput.trim() && !selectedUni) || isSaving}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-2 font-mono text-xs font-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 stroke-[3]" />
                  <span>Save Affiliation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
