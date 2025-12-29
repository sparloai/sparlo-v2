import { ReactNode } from 'react';

interface ReportSection {
  id: string;
  number: string;
  title: string;
  content: ReactNode;
}

interface ExampleReport {
  id: string;
  title: string;
  headline: string;
  subtitle: string;
  locked: boolean;
  metadata: {
    readTime: string;
    dataPoints: string;
  };
  sections: ReportSection[];
}

export const EXAMPLE_REPORTS: ExampleReport[] = [
  {
    id: 'climate-tech',
    title: 'Climate Tech',
    headline:
      'Recyclable High-Performance Composites: Repurposing Polyurethane Glycolysis at Industrial Scale',
    subtitle: 'Recyclable High-Performance Composite Matrix',
    locked: false,
    metadata: {
      readTime: '18 min read',
      dataPoints: '4.2M data points',
    },
    sections: [
      {
        id: 'brief',
        number: '01',
        title: 'The Brief',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              Carbon fiber reinforced thermosets dominate aerospace and
              automotive lightweighting, but end-of-life is landfill or
              energy-intensive pyrolysis that destroys the fiber.
            </p>
            <p className="mt-4">
              Thermoplastic composites are recyclable but can&apos;t match
              thermoset performance at high temperatures and lack creep
              resistance. Industry produces 500K+ tons of composite waste
              annually, growing rapidly.
            </p>
            <p className="mt-4 font-medium">
              Need composite system with thermoset-like performance (Tg
              &gt;180°C, creep resistance, processability) that can be
              chemically or thermally recycled to recover fibers at &gt;90%
              property retention.
            </p>
          </>
        ),
      },
      {
        id: 'executive-summary',
        number: '02',
        title: 'Executive Summary',
        content: (
          <>
            <p className="text-xl leading-relaxed font-light text-zinc-950">
              The composite recycling problem has been framed as a materials
              chemistry challenge, but the real breakthrough lies in recognizing
              that industrial glycolysis infrastructure already exists at
              scale—BASF and others process millions of tons of polyurethane
              annually using the exact transesterification chemistry needed for
              polyester thermoset recycling.
            </p>
            <p className="mt-6">
              By designing an aromatic polyester matrix optimized for aerospace
              Tg rather than the historical boat-hull applications that gave
              polyesters a &quot;low-performance&quot; reputation, we can
              achieve Tg &gt;180°C with a recycling pathway that recovers both
              fiber AND monomer feedstock using proven industrial equipment.
            </p>
            <div className="mt-8 rounded-xl border border-l-4 border-zinc-200 border-l-zinc-900 bg-zinc-50/30 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
                Primary Recommendation
              </span>
              <p className="mt-3 text-base leading-relaxed font-medium text-zinc-900">
                Pursue glycolyzable aromatic polyester thermoset development as
                primary path, with locked-catalyst vitrimer as parallel track.
                Investment of $3-8M over 3-4 years to aerospace qualification.
              </p>
            </div>
          </>
        ),
      },
      {
        id: 'challenge-the-frame',
        number: '03',
        title: 'Challenge the Frame',
        content: (
          <>
            <p className="mb-6">
              Before diving into solutions, we challenged the fundamental
              assumptions in the problem statement:
            </p>
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  Tg &gt;180°C is a hard requirement
                </p>
                <p className="mt-3 text-zinc-600">
                  Many aerospace applications have lower actual service
                  temperatures. The Tg spec may include safety margin that could
                  be traded for recyclability. If Tg 150-160°C is acceptable for
                  some applications, Recyclamine-type chemistry becomes viable.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  Existing manufacturing processes cannot be modified
                </p>
                <p className="mt-3 text-zinc-600">
                  If recyclability provides sufficient value, manufacturers may
                  accept process modifications. This opens inorganic matrix
                  approaches (CAC, geopolymer) if processing innovation is
                  acceptable.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  Fiber recovery is the primary value driver
                </p>
                <p className="mt-3 text-zinc-600">
                  For some waste streams, composite-level recycling (reshaping
                  entire part) may be more valuable than fiber recovery.
                  Vitrimer thermoforming enables this.
                </p>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'primary-solution',
        number: '04',
        title: 'Primary Solution',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              Design a thermoset matrix using aromatic diacids (isophthalic
              acid, 2,6-naphthalenedicarboxylic acid) and rigid diols
              (isosorbide, tricyclodecanedimethanol) with high crosslink density
              achieved through multifunctional monomers.
            </p>
            <div className="my-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  78%
                </p>
                <p className="mt-1 text-sm text-zinc-500">Confidence Level</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  $3-8M
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Investment Required
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  3-4 yrs
                </p>
                <p className="mt-1 text-sm text-zinc-500">To Qualification</p>
              </div>
            </div>
            <h3 className="mt-8 text-xl font-semibold text-zinc-900">
              Why It Works
            </h3>
            <p className="mt-4">
              Transesterification equilibrium is driven by glycol concentration.
              At 10-100x molar excess of ethylene glycol, the equilibrium
              strongly favors network fragmentation into glycol-terminated
              oligomers. The reaction proceeds through nucleophilic attack of
              glycol hydroxyl on ester carbonyl, catalyzed by Lewis acid
              coordination to carbonyl oxygen.
            </p>
            <p className="mt-4">
              Critically, the same reaction is negligibly slow at service
              conditions. Without catalyst and excess glycol, ester hydrolysis
              at neutral pH and 80°C has a half-life of centuries. The trigger
              is truly orthogonal—you cannot accidentally glycolyze your wing
              spar.
            </p>
          </>
        ),
      },
      {
        id: 'innovation-concept',
        number: '05',
        title: 'Innovation Concept',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              Combine catechol-metal coordination chemistry—inspired by mussel
              byssus threads—with a high-Tg polybenzoxazine backbone. This
              represents a cross-domain innovation that the industry missed.
            </p>
            <div className="my-8 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-amber-50/50 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-amber-700 uppercase">
                The Key Insight
              </span>
              <p className="mt-3 text-amber-900">
                Metal-coordination bonds can achieve near-covalent mechanical
                strength while remaining pH-reversible. This was found in mussel
                byssus biology—mussels use Fe³⁺-catechol coordination to create
                byssal threads with remarkable toughness and self-healing
                capability.
              </p>
            </div>
            <p className="mt-4">
              For recycling, immersion in 0.1M HCl at room temperature
              protonates catechol groups, releasing Al³⁺ and fragmenting the
              network. The recycling conditions are remarkably mild: room
              temperature, dilute food-grade acid, complete dissolution in
              hours.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  Confidence
                </span>
                <p className="mt-1 text-2xl font-bold text-zinc-900">52%</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  Timeline
                </span>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  4-6 years
                </p>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'risks',
        number: '06',
        title: 'Risks & Watchouts',
        content: (
          <>
            <p className="mb-6">
              Critical risks to monitor and mitigate throughout development:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-red-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 font-mono text-xs font-bold text-white">
                  H
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    Achieving Tg &gt;180°C with processable viscosity
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Screen reactive diluents; optimize monomer ratios; consider
                    prepreg route if RTM infusion problematic
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-white">
                  M
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    Fiber-matrix adhesion with non-epoxy matrices
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Engage fiber manufacturer early; validate interfacial shear
                    strength with candidate sizings
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-white">
                  M
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    Aerospace qualification timeline exceeds investor patience
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Target manufacturing scrap recycling first; automotive
                    applications as parallel market
                  </p>
                </div>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'next-steps',
        number: '07',
        title: 'Next Steps',
        content: (
          <>
            <p className="mb-6">
              If this were my project, I&apos;d start with the glycolyzable
              aromatic polyester—not because it&apos;s the most innovative, but
              because it has the clearest path to success.
            </p>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  1
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Run polyester and vitrimer tracks in parallel for 12 months
                  </p>
                  <p className="mt-2 text-zinc-600">
                    The vitrimer has Mallinda as a reference point; if either
                    track hits a wall, you have a fallback
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  2
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Keep catechol-metal as longer-term bet
                  </p>
                  <p className="mt-2 text-zinc-600">
                    Fund at 20% of portfolio; let it mature while polyester
                    track de-risks the business case
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  3
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Engage fiber manufacturer from day one
                  </p>
                  <p className="mt-2 text-zinc-600">
                    Toray, Hexcel, or Toho Tenax—they have the most to gain from
                    a recyclable composite
                  </p>
                </div>
              </li>
            </ol>
          </>
        ),
      },
    ],
  },
  {
    id: 'food-waste',
    title: 'Waste',
    headline:
      'On-Site Food Waste Processing: Mechanical-First Architecture for 80% Energy Reduction',
    subtitle: 'Commercial Kitchen Waste-to-Value System',
    locked: false,
    metadata: {
      readTime: '20 min read',
      dataPoints: '3.5M data points',
    },
    sections: [],
  },
  {
    id: 'food-tech',
    title: 'Food Tech',
    headline:
      'Breaking the Cold Chain Assumption: Multi-Mechanism Preservation for Smallholder Farmers',
    subtitle: 'Post-Harvest Loss Reduction System',
    locked: false,
    metadata: {
      readTime: '18 min read',
      dataPoints: '2.8M data points',
    },
    sections: [],
  },
  {
    id: 'biotech',
    title: 'Biotech',
    headline:
      'CAR-T Manufacturing Cost Reduction: From $300K to $30K Through Integration, Not Invention',
    subtitle: 'CAR-T Cell Therapy Manufacturing Innovation',
    locked: false,
    metadata: {
      readTime: '51 min read',
      dataPoints: '4.8M data points',
    },
    sections: [
      {
        id: 'brief',
        number: '01',
        title: 'The Brief',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              CAR-T manufacturing costs $300-500K per patient, with 2-4 week
              vein-to-vein time during which patients often progress. The
              autologous model requires dedicated manufacturing per patient with
              no economies of scale.
            </p>
            <p className="mt-4">
              Allogeneic approaches solve cost but create rejection and
              persistence problems. Need a path to &lt;$50K manufacturing cost
              while maintaining autologous-like persistence and efficacy.
            </p>
            <p className="mt-4 font-medium">
              Process must work with variable input material quality—patient
              cells post-chemo are often in poor condition.
            </p>
          </>
        ),
      },
      {
        id: 'executive-summary',
        number: '02',
        title: 'Executive Summary',
        content: (
          <>
            <p className="text-xl leading-relaxed font-light text-zinc-950">
              The CAR-T industry has been solving three separate problems—viral
              vector cost, manufacturing time, and automation—as if they were
              unrelated. They&apos;re not.
            </p>
            <p className="mt-6">
              Novartis proved 2-day manufacturing works (T-Charge), academic
              groups proved non-viral transduction works (Sleeping Beauty), and
              Miltenyi proved automated closed systems work (Prodigy). No one
              has combined them because different companies own different
              pieces. The integration is the innovation, and it&apos;s
              achievable in 18-24 months for $2-5M investment, delivering
              $25-35K COGS—a 10x cost reduction using only validated components.
            </p>
            <div className="mt-8 rounded-xl border border-l-4 border-zinc-200 border-l-zinc-900 bg-zinc-50/30 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
                Primary Recommendation
              </span>
              <p className="mt-3 text-base leading-relaxed font-medium text-zinc-900">
                Pursue integrated rapid manufacturing combining Prodigy
                automation + Sleeping Beauty non-viral transduction +
                T-Charge-style minimal expansion with in vivo expansion support.
                This eliminates the $50-100K viral vector cost, reduces
                cleanroom time from 14 days to 2-3 days, and uses existing
                FDA-accepted automation. Investment of $2-5M over 18-24 months
                to IND.
              </p>
            </div>
          </>
        ),
      },
      {
        id: 'problem-analysis',
        number: '03',
        title: 'Problem Analysis',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              CAR-T manufacturing faces three irreducible constraints that
              compound into the current cost structure.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="font-medium text-zinc-900">
                  Cell Expansion Kinetics
                </p>
                <p className="mt-2 text-zinc-600">
                  T-cells double every 24-48 hours under optimal stimulation,
                  meaning reaching therapeutic dose (10⁹ cells) from apheresis
                  input requires ~7 doublings minimum, or 7-14 days.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="font-medium text-zinc-900">
                  Sterility Requirements
                </p>
                <p className="mt-2 text-zinc-600">
                  Biological products require contamination control, and the
                  14-day sterility culture adds unavoidable wait time.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="font-medium text-zinc-900">Batch-of-One Model</p>
                <p className="mt-2 text-zinc-600">
                  Each patient requires dedicated manufacturing with fixed costs
                  (cleanroom, personnel, QC) that cannot be amortized across
                  patients.
                </p>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-l-4 border-zinc-200 border-l-emerald-500 bg-emerald-50/50 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-emerald-700 uppercase">
                First Principles Insight
              </span>
              <p className="mt-3 font-medium text-emerald-900">
                The expansion doesn&apos;t need to happen in the factory—it can
                happen in the patient
              </p>
              <p className="mt-2 text-emerald-800">
                Lymph nodes achieve 10,000-fold T-cell expansion in 5-7 days
                during infection. T-Charge proved that infusing
                minimally-expanded cells with cytokine support achieves
                therapeutic doses through in vivo expansion. This insight
                collapses the manufacturing timeline from 14 days to 2-3 days.
              </p>
            </div>
          </>
        ),
      },
      {
        id: 'challenge-the-frame',
        number: '04',
        title: 'Challenge the Frame',
        content: (
          <>
            <p className="mb-6">
              Instead of asking &quot;how do we make ex vivo manufacturing
              cheaper,&quot; we asked &quot;which parts of ex vivo manufacturing
              are actually necessary, and what can the patient&apos;s biology do
              better?&quot;
            </p>
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  Autologous persistence is required for efficacy
                </p>
                <p className="mt-3 text-zinc-600">
                  mRNA CAR-T trials show clinical responses with transient
                  expression. If redosing is cheap, transient expression with
                  repeated dosing may achieve equivalent outcomes without the
                  complexity of stable integration.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  The $50K cost target is the right goal
                </p>
                <p className="mt-3 text-zinc-600">
                  If CAR-T achieves cure in 40-80% of patients, even $100K may
                  be cost-effective vs. alternatives (palliative care, repeated
                  chemotherapy, transplant). The cost target may be driven by
                  payer negotiations rather than true value.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Assumption
                </span>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  Manufacturing failures are primarily process-related
                </p>
                <p className="mt-3 text-zinc-600">
                  Patient T-cell fitness determines outcomes. Manufacturing
                  &quot;failures&quot; may actually be patient selection
                  failures—some patients simply don&apos;t have T-cells capable
                  of becoming effective CAR-T.
                </p>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'primary-solution',
        number: '05',
        title: 'Primary Solution',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              Combine three individually validated technologies into a single
              optimized workflow: Miltenyi Prodigy automated closed system for
              cell processing, Sleeping Beauty transposon system for non-viral
              CAR delivery, and T-Charge-style minimal expansion (2-3 days) with
              IL-7/IL-15 cytokine support for in vivo expansion.
            </p>
            <div className="my-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  85%
                </p>
                <p className="mt-1 text-sm text-zinc-500">Confidence Level</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  $25-35K
                </p>
                <p className="mt-1 text-sm text-zinc-500">COGS per Patient</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="font-mono text-3xl font-bold text-zinc-900">
                  18-24mo
                </p>
                <p className="mt-1 text-sm text-zinc-500">Timeline to IND</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-amber-50/50 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-amber-700 uppercase">
                The Key Insight
              </span>
              <p className="mt-3 text-amber-900">
                The three major cost drivers (viral vectors, expansion time,
                manual processing) have each been solved independently—the
                industry just hasn&apos;t combined the solutions because
                different companies own different pieces.
              </p>
            </div>
            <p className="mt-6">
              This eliminates the $50-100K viral vector cost entirely (Sleeping
              Beauty reagents cost &lt;$1K), reduces cleanroom time from 14 days
              to 2-3 days, and uses existing FDA-accepted automation. No new
              technology required—the innovation is integration across
              commercial silos.
            </p>
          </>
        ),
      },
      {
        id: 'innovation-concept',
        number: '06',
        title: 'Innovation Concept',
        content: (
          <>
            <p className="text-lg leading-relaxed">
              Eliminate ex vivo manufacturing entirely by injecting lipid
              nanoparticles loaded with CAR-encoding mRNA that selectively
              transfect T-cells in vivo. Manufacturing becomes LNP-mRNA
              production—scalable, inventoriable, and proven at billions of
              doses through COVID vaccines.
            </p>
            <div className="my-8 rounded-xl border border-l-4 border-zinc-200 border-l-violet-500 bg-violet-50/50 p-6">
              <span className="font-mono text-xs font-bold tracking-widest text-violet-700 uppercase">
                Breakthrough Potential
              </span>
              <p className="mt-3 text-violet-900">
                If it works: Complete elimination of ex vivo manufacturing.
                CAR-T becomes an injectable drug rather than a manufactured cell
                product. Same-day treatment becomes possible. Manufacturing
                scales like vaccines, not like cell therapy.
              </p>
              <p className="mt-2 font-medium text-violet-800">
                100-1000x cost reduction (from $275K to $3-12K per treatment
                course)
              </p>
            </div>
            <p className="mt-4">
              This is not theoretical—Rurik et al. (Science 2022) demonstrated
              functional CAR-T generation in mice using CD5-targeted LNPs.
              Capstan Therapeutics is pursuing clinical development with IND
              targeted for 2025.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  Confidence
                </span>
                <p className="mt-1 text-2xl font-bold text-zinc-900">55%</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  Earliest Viability
                </span>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  3-5 years
                </p>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'risks',
        number: '07',
        title: 'Risks & Watchouts',
        content: (
          <>
            <p className="mb-6">
              Critical risks to monitor and mitigate throughout development:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-red-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 font-mono text-xs font-bold text-white">
                  H
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    Sleeping Beauty efficiency in Prodigy context may be lower
                    than standalone
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    First validation step specifically tests this. If efficiency
                    is &lt;10%, troubleshoot electroporation parameters. If
                    still failing, CRISPR knock-in is alternative non-viral
                    approach.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-white">
                  M
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    FDA may require extensive bridging studies for combined
                    novel elements
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Pre-IND meeting to align on bridging study design. Consider
                    academic IND initially to generate data before commercial
                    program.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-l-4 border-zinc-200 border-l-amber-500 bg-white p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-white">
                  M
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    In vivo expansion kinetics may be highly variable across
                    patient populations
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    T-Charge data provides baseline variability estimates.
                    Patient selection criteria can exclude severe lymphopenia.
                    IL-7/IL-15 dosing can be adjusted based on early expansion
                    kinetics.
                  </p>
                </div>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'recommendation',
        number: '08',
        title: 'Recommendation',
        content: (
          <>
            <p className="mb-6 text-lg">
              If this were my project, I&apos;d start with the validation
              experiment immediately—$50-75K to test Sleeping Beauty efficiency
              in Prodigy is cheap insurance before committing to the full
              program.
            </p>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  1
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Run the validation experiment first
                  </p>
                  <p className="mt-2 text-zinc-600">
                    While that&apos;s running, have the pre-IND meeting
                    conversation with FDA to understand their expectations for
                    bridging studies. The regulatory pathway is the biggest
                    unknown.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  2
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Pursue hospital blood bank model in parallel
                  </p>
                  <p className="mt-2 text-zinc-600">
                    Start with a single site partnership rather than building a
                    network. Find one academic medical center with both a strong
                    blood bank and CAR-T program.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-medium text-white">
                  3
                </span>
                <div>
                  <p className="text-lg font-medium text-zinc-900">
                    Keep a watching brief on in vivo LNP-mRNA
                  </p>
                  <p className="mt-2 text-zinc-600">
                    If Capstan&apos;s IND goes well, that&apos;s the future—but
                    it&apos;s 5+ years out, so it doesn&apos;t change near-term
                    strategy.
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="font-medium text-zinc-900">
                The thing I&apos;d avoid is trying to do everything at once.
              </p>
              <p className="mt-2 text-zinc-600">
                The integrated manufacturing approach is the highest-probability
                path to the cost target. Get that working first, then layer on
                the blood bank network for distribution, then watch the in vivo
                approaches mature. Sequence matters—don&apos;t let the perfect
                be the enemy of the good.
              </p>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: 'energy',
    title: 'Energy',
    headline:
      'EV Fleet Thermal Management: Depot-Centric Pre-Conditioning for 40% Winter Range Recovery',
    subtitle: 'Cold Climate Electric Vehicle Optimization',
    locked: false,
    metadata: {
      readTime: '24 min read',
      dataPoints: '5.1M data points',
    },
    sections: [],
  },
  {
    id: 'materials-science',
    title: 'Materials Science',
    headline:
      'Transparent Wood at Scale: Lignin-Retention Processing for Architectural Glass Replacement',
    subtitle: 'Sustainable Building Materials Innovation',
    locked: false,
    metadata: {
      readTime: '26 min read',
      dataPoints: '6.3M data points',
    },
    sections: [],
  },
];
