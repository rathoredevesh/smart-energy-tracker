import { useEffect, useState } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";

const DEFAULT_PROFILE = {
  displayName: "Govinder Home",
  householdName: "You",
  city: "Bengaluru Metro Grid",
  monthlyBudgetInr: 3500,
  homeType: "Apartment",
  familySize: "4",
  primaryGoal: "Lower monthly bill",
};

export default function OnboardingModal({
  open,
  availableHouseholds = [],
  initialProfile,
  onClose,
  onSave,
}) {
  const [profile, setProfile] = useState(initialProfile ?? DEFAULT_PROFILE);

  useEffect(() => {
    setProfile(initialProfile ?? DEFAULT_PROFILE);
  }, [initialProfile]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-[32px] p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-label">Onboarding</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">
              Personalize your energy command center
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Set your household profile, budget, and priorities so the site can feel
              tailored from the first screen onward.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Display Name</span>
            <input
              value={profile.displayName}
              onChange={(event) =>
                setProfile({ ...profile, displayName: event.target.value })
              }
              className="theme-input w-full"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Household Data Profile</span>
            <select
              value={profile.householdName}
              onChange={(event) =>
                setProfile({ ...profile, householdName: event.target.value })
              }
              className="theme-input w-full"
            >
              {availableHouseholds.map((household) => (
                <option key={household} value={household}>
                  {household}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>City</span>
            <input
              value={profile.city}
              onChange={(event) => setProfile({ ...profile, city: event.target.value })}
              className="theme-input w-full"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Monthly Budget (INR)</span>
            <input
              type="number"
              min="1000"
              value={profile.monthlyBudgetInr}
              onChange={(event) =>
                setProfile({ ...profile, monthlyBudgetInr: Number(event.target.value) })
              }
              className="theme-input w-full"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Home Type</span>
            <select
              value={profile.homeType}
              onChange={(event) => setProfile({ ...profile, homeType: event.target.value })}
              className="theme-input w-full"
            >
              <option>Apartment</option>
              <option>Villa</option>
              <option>Duplex</option>
              <option>Independent House</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Family Size</span>
            <select
              value={profile.familySize}
              onChange={(event) => setProfile({ ...profile, familySize: event.target.value })}
              className="theme-input w-full"
            >
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5+</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
            <span>Primary Goal</span>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                "Lower monthly bill",
                "Reduce carbon footprint",
                "Beat similar homes",
              ].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setProfile({ ...profile, primaryGoal: goal })}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    profile.primaryGoal === goal
                      ? "border-tealglow/35 bg-tealglow/10 text-white"
                      : "border-white/10 bg-white/[0.04] text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {profile.primaryGoal === goal ? (
                      <Sparkles size={16} />
                    ) : (
                      <SlidersHorizontal size={16} />
                    )}
                    <span className="font-medium">{goal}</span>
                  </div>
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSave(profile)}
            className="rounded-full bg-tealglow px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Save Profile
          </button>
          <button
            type="button"
            onClick={() => onSave(DEFAULT_PROFILE)}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
          >
            Use Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
