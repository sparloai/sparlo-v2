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
    headline: 'Recyclable High-Performance Composites: Repurposing Polyurethane Glycolysis at Industrial Scale',
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
    headline: 'On-Site Food Waste Processing: Mechanical-First Architecture for 80% Energy Reduction',
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
    headline: 'Breaking the Cold Chain Assumption: Multi-Mechanism Preservation for Smallholder Farmers',
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
    headline: 'Endosomal Escape Enhancement: pH-Responsive Lipid Architecture for 3x Cytosolic Delivery',
    subtitle: 'mRNA Therapeutics Delivery Optimization',
    locked: false,
    metadata: {
      readTime: '22 min read',
      dataPoints: '3.8M data points',
    },
    sections: [],
  },
  {
    id: 'energy',
    title: 'Energy',
    headline: 'EV Fleet Thermal Management: Depot-Centric Pre-Conditioning for 40% Winter Range Recovery',
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
    headline: 'Transparent Wood at Scale: Lignin-Retention Processing for Architectural Glass Replacement',
    subtitle: 'Sustainable Building Materials Innovation',
    locked: false,
    metadata: {
      readTime: '26 min read',
      dataPoints: '6.3M data points',
    },
    sections: [],
  },
];
