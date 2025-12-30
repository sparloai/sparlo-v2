import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

/**
 * Biotech Hybrid Report Example Data
 * CAR-T Manufacturing Cost Reduction
 */
export const BIOTECH_HYBRID_REPORT: HybridReportData = {
  title:
    'CAR-T Manufacturing Cost Reduction: From $300K to $30K Through Integration, Not Invention',
  brief:
    'CAR-T manufacturing costs $300-500K per patient, with 2-4 week vein-to-vein time during which patients often progress. The autologous model requires dedicated manufacturing per patient with no economies of scale. Allogeneic approaches solve cost but create rejection and persistence problems. Need a path to <$50K manufacturing cost while maintaining autologous-like persistence and efficacy. Process must work with variable input material quality—patient cells post-chemo are often in poor condition.',

  executive_summary: {
    narrative_lead:
      "The CAR-T industry has been solving three separate problems—viral vector cost, manufacturing time, and automation—as if they were unrelated. They're not. Novartis proved 2-day manufacturing works (T-Charge), academic groups proved non-viral transduction works (Sleeping Beauty), and Miltenyi proved automated closed systems work (Prodigy). No one has combined them because different companies own different pieces. The integration is the innovation, and it's achievable in 18-24 months for $2-5M investment, delivering $25-35K COGS—a 10x cost reduction using only validated components.",
    primary_recommendation:
      'Pursue integrated rapid manufacturing combining Prodigy automation + Sleeping Beauty non-viral transduction + T-Charge-style minimal expansion with in vivo expansion support. This eliminates the $50-100K viral vector cost, reduces cleanroom time from 14 days to 2-3 days, and uses existing FDA-accepted automation. Investment of $2-5M over 18-24 months to IND. Parallel track: begin hospital blood bank pilot to validate decentralized manufacturing model.',
    viability: 'uncertain',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        'CAR-T manufacturing faces three irreducible constraints that compound into the current cost structure. First, cell expansion kinetics: T-cells double every 24-48 hours under optimal stimulation, meaning reaching therapeutic dose (10^9 cells) from apheresis input (10^7 CAR+ cells after transduction) requires ~7 doublings minimum, or 7-14 days. Second, sterility requirements: biological products require contamination control, and the 14-day sterility culture adds unavoidable wait time. Third, the batch-of-one model: each patient requires dedicated manufacturing with fixed costs (cleanroom, personnel, QC) that cannot be amortized across patients. The physics of cell biology set the floor; the business model prevents economies of scale.',
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Novartis (T-Charge platform)',
          approach: '2-day manufacturing with in vivo expansion',
          current_performance:
            'Comparable efficacy to standard 9-14 day protocols in Phase 1/2',
          target_roadmap:
            'Replace standard Kymriah manufacturing; reduce turnaround to <1 week',
          source: 'Dickinson et al., Blood 2023; NCT03761056',
        },
        {
          entity: 'MD Anderson / Ziopharm (Sleeping Beauty)',
          approach: 'Non-viral transposon-based CAR delivery',
          current_performance:
            '10-30% transduction efficiency; clinical responses in Phase 1',
          target_roadmap: 'Eliminate viral vector dependency entirely',
          source: 'Kebriaei et al., JCI 2016',
        },
        {
          entity: 'Capstan Therapeutics',
          approach: 'In vivo CAR generation via T-cell-targeted LNP-mRNA',
          current_performance:
            'Preclinical proof of concept; functional CAR-T generated in vivo',
          target_roadmap:
            'IND filing 2025; eliminate ex vivo manufacturing entirely',
          source: 'Company presentations; Rurik et al., Science 2022',
        },
        {
          entity: 'Fate Therapeutics',
          approach: 'iPSC-derived allogeneic CAR-T',
          current_performance:
            'Unlimited starting material; manufacturing at scale demonstrated',
          target_roadmap:
            'Solve persistence through engineering; true off-the-shelf product',
          source: 'Mandal et al., Cell Stem Cell 2022',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach:
          'Centralized GMP manufacturing with lentiviral vectors (Novartis/Kite model)',
        limitation:
          '$150-200K COGS, 3-4 week turnaround, patient progression during wait, 5-15% manufacturing failures',
      },
      {
        approach:
          'Point-of-care manufacturing with automation (Miltenyi Prodigy)',
        limitation:
          'Reduces logistics but still uses expensive viral vectors; $100K+ per run',
      },
      {
        approach: 'Allogeneic off-the-shelf (Allogene, Precision Bio)',
        limitation:
          '$20-30K COGS but persistence measured in weeks, not months; requires redosing',
      },
      {
        approach: 'Gene-edited allogeneic (CRISPR Therapeutics)',
        limitation:
          "HLA knockout enables immune evasion but doesn't solve persistence; complex manufacturing",
      },
    ],
    why_its_hard: {
      prose:
        'The fundamental challenge is that the same crosslink density providing high Tg and creep resistance also makes the network resistant to dissolution. CAR-T manufacturing faces three irreducible constraints: cell expansion kinetics (7-14 days minimum), sterility requirements (14-day culture), and the batch-of-one model (fixed costs per patient). The physics of cell biology set the floor; the business model prevents economies of scale.',
      governing_equation: {
        equation:
          'COGS = (Vector Cost + Cleanroom Days × Daily Rate + QC/Release + Labor + Logistics) / Success Rate',
        explanation:
          'Current: ($75K + 14×$7K + $30K + $25K + $15K) / 0.90 = ~$275K. Target requires attacking multiple terms simultaneously.',
      },
    },
    first_principles_insight: {
      headline:
        "The expansion doesn't need to happen in the factory—it can happen in the patient",
      explanation:
        'Lymph nodes achieve 10,000-fold T-cell expansion in 5-7 days during infection. Current CAR-T manufacturing tries to replicate this in culture flasks, poorly. T-Charge proved that infusing minimally-expanded cells with cytokine support achieves therapeutic doses through in vivo expansion. This insight collapses the manufacturing timeline from 14 days to 2-3 days and eliminates most cleanroom costs.',
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      "Must maintain autologous persistence (patient's own cells avoid rejection)",
      'Must achieve therapeutic dose (10^8-10^9 functional CAR-T cells)',
      'Must meet FDA GMP requirements for cell therapy',
      'Must maintain efficacy comparable to approved products (non-inferior CR rates)',
    ],
    soft_constraints: [
      'Target <$50K COGS (assumed fully-loaded excluding R&D amortization)',
      'Vein-to-vein time reduction (valuable but secondary to cost)',
      'Process robustness across variable input quality (important but can be addressed through patient selection initially)',
    ],
    assumptions: [
      'Cost target is COGS, not selling price—if margin requirements differ, adjust targets',
      'Persistence requirement assumes months-to-years; if shorter persistence with redosing acceptable, different approaches viable',
      'Efficacy comparison is to current approved products in same indication (B-ALL, DLBCL)',
      'Vector costs are included in COGS target',
    ],
    success_metrics: [
      {
        metric: 'Manufacturing COGS per patient',
        target: '$30K',
        minimum_viable: '$50K',
        stretch: '$20K',
        unit: 'USD',
      },
      {
        metric: 'Vein-to-vein time',
        target: '7 days',
        minimum_viable: '14 days',
        stretch: '5 days',
        unit: 'days',
      },
      {
        metric: 'Manufacturing success rate',
        target: '95%',
        minimum_viable: '90%',
        stretch: '98%',
        unit: 'percent',
      },
      {
        metric: 'CAR-T persistence',
        target: '6 months detectable',
        minimum_viable: '3 months functional',
        stretch: '12 months detectable',
        unit: 'months',
      },
      {
        metric: 'Complete response rate',
        target: 'Non-inferior to Kymriah/Yescarta',
        minimum_viable: 'Within 10% of comparator',
        stretch: 'Superior to comparator',
        unit: 'percent CR',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'Autologous persistence is required for efficacy',
      challenge:
        'mRNA CAR-T trials show clinical responses with transient expression. If redosing is cheap, transient expression with repeated dosing may achieve equivalent outcomes without the complexity of stable integration.',
      implication:
        "If transient expression is sufficient, in vivo LNP-mRNA becomes even more attractive, and the 'persistence problem' for allogeneic approaches becomes less critical.",
    },
    {
      assumption: 'The $50K cost target is the right goal',
      challenge:
        'If CAR-T achieves cure in 40-80% of patients, even $100K may be cost-effective vs. alternatives (palliative care, repeated chemotherapy, transplant). The cost target may be driven by payer negotiations rather than true value.',
      implication:
        'If $100K is acceptable, simpler approaches (stable producer lines alone, without non-viral transduction) may be sufficient. The integrated approach may be over-engineering.',
    },
    {
      assumption: 'Manufacturing failures are primarily process-related',
      challenge:
        "Fraietta et al. showed patient T-cell fitness determines outcomes. Manufacturing 'failures' may actually be patient selection failures—some patients simply don't have T-cells capable of becoming effective CAR-T.",
      implication:
        "If input quality is the bottleneck, process improvements won't help the hardest cases. Alternative cell sources (tissue-resident T-cells, iPSC-derived) or allogeneic approaches become more important.",
    },
    {
      assumption: 'Hospital blood banks can achieve manufacturing quality',
      challenge:
        'Blood bank processing is simpler than CAR-T manufacturing. The failure modes are different (contamination vs. poor expansion). Site-to-site variability may be unacceptable for a cell therapy product.',
      implication:
        'If decentralized manufacturing proves too variable, the centralized model may be necessary despite higher costs. Investment in blood bank network may be wasted.',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Viral vector manufacturing and producer cell lines',
      'Non-viral gene delivery (Sleeping Beauty, piggyBac, CRISPR)',
      'Automated cell processing systems',
      'In vivo T-cell engineering approaches',
      'Bone marrow transplant tolerance protocols',
      'Cytokine biology and T-cell expansion',
    ],
    reframe:
      "Instead of asking 'how do we make ex vivo manufacturing cheaper,' we asked 'which parts of ex vivo manufacturing are actually necessary, and what can the patient's biology do better?'",
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. These represent the lowest-risk path to the cost target, achievable in 18-36 months with existing regulatory frameworks.',
    primary: {
      id: 'sol-primary',
      title:
        'Integrated Rapid Manufacturing: T-Charge + Sleeping Beauty + Prodigy',
      confidence: 85,
      source_type: 'TRANSFER',
      bottom_line:
        'Combine three individually validated technologies into a single optimized workflow: Miltenyi Prodigy automated closed system for cell processing, Sleeping Beauty transposon system for non-viral CAR delivery, and T-Charge-style minimal expansion (2-3 days) with IL-7/IL-15 cytokine support for in vivo expansion.',
      expected_improvement: '$25-35K COGS per patient',
      timeline: '18-24 months to IND',
      investment: '$2-5M',
      the_insight: {
        what: "The three major cost drivers (viral vectors, expansion time, manual processing) have each been solved independently—the industry just hasn't combined the solutions because different companies own different pieces",
        where_we_found_it: {
          domain: 'Integration across CAR-T manufacturing innovations',
          how_they_use_it:
            'Novartis uses T-Charge with lentivirus; MD Anderson uses Sleeping Beauty with standard expansion; hospitals use Prodigy with traditional protocols',
          why_it_transfers:
            'Each component addresses a different cost driver; combined, they attack the entire cost structure simultaneously',
        },
        why_industry_missed_it:
          "Commercial silos and IP ownership. Novartis has no incentive to adopt Sleeping Beauty (competitor technology). Sleeping Beauty developers use traditional expansion protocols. Prodigy users follow manufacturer-recommended workflows. No single company has economic incentive to combine competitors' innovations.",
      },
      what_it_is:
        'No new technology required—the innovation is integration across commercial silos. The process flow: Day 0, leukapheresis product is loaded into Prodigy with CD3+ selection via CliniMACS beads. Same day, electroporation of Sleeping Beauty transposon (encoding CAR) plus transposase mRNA, followed by overnight recovery in IL-7/IL-15 media. Days 1-2, minimal activation with CD3/CD28 stimulation—not full expansion, just enough to confirm viability and CAR expression. Day 2-3, wash, formulate, QC sampling, and release. Infuse minimally-expanded CAR-T (10^7-10^8 cells) with IL-7/IL-15 cytokine support for in vivo expansion to therapeutic dose. This eliminates the $50-100K viral vector cost entirely (Sleeping Beauty reagents cost <$1K), reduces cleanroom time from 14 days to 2-3 days, and uses existing FDA-accepted automation.',
      why_it_works:
        "The physics of each component are well-established. Electroporation creates transient membrane pores via dielectric breakdown at ~1000 V/cm, allowing DNA entry—this is 40-year-old technology. Sleeping Beauty transposase recognizes inverted terminal repeats, excises the CAR cassette, and integrates at TA dinucleotide sites via cut-and-paste mechanism—integration efficiency of 10-30% is lower than lentivirus but sufficient when combined with in vivo expansion. T-cell expansion in vivo follows normal immunobiology: IL-7 promotes survival and homeostatic proliferation, IL-15 drives effector function and memory formation. The lymph node achieves 10,000-fold expansion in 5-7 days; we're leveraging this rather than fighting it with suboptimal flask culture.",
      why_it_might_fail: [
        'Sleeping Beauty transduction efficiency in Prodigy context may be significantly lower than standalone, requiring process re-optimization or acceptance of viral vectors',
        'FDA may require more extensive bridging studies for combined novel elements (non-viral + minimal expansion + automation) than estimated, extending timeline by 12-24 months',
        'In vivo expansion kinetics may be highly variable across patient populations, leading to unpredictable dosing and outcomes',
      ],
      validation_gates: [
        {
          week: '8-12',
          test: 'Demonstrate Sleeping Beauty transduction efficiency in Prodigy-processed T-cells matches standalone efficiency (target: >15% CAR+ at day 2)',
          method:
            'Flow cytometry for CAR expression; viability assay; comparison to standalone Sleeping Beauty protocol',
          success_criteria:
            'CAR+ percentage >15% at day 2 with >70% viability across all three runs; no significant difference from standalone Sleeping Beauty transduction',
          cost: '$50-75K (Prodigy consumables ~$10K/run × 3, plasmids ~$15K, flow cytometry and analysis ~$10K, personnel time ~$10K)',
          decision_point:
            'If efficiency is <10%, troubleshoot electroporation parameters. If still failing, CRISPR knock-in is alternative non-viral approach with higher efficiency.',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Hospital Blood Bank Manufacturing Network',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Deploy CAR-T manufacturing as an extension of existing hospital blood bank operations using Prodigy-class automation',
        confidence: 70,
        what_it_is:
          'Blood banks already perform GMP-equivalent cell processing (platelet apheresis, stem cell processing, cord blood banking) with technician-level staff under AABB/FDA 21 CFR 606 standards. The model: standardized protocol locked into Prodigy software, cloud-connected monitoring with central expert oversight, remote QC review and batch release by centralized quality team, reagent kits shipped to site with lot-traced components. Manufacturing happens locally; expertise is networked. This eliminates $15-20K logistics costs per patient.',
        why_it_works:
          'No new physics—blood banks already do the hard parts (sterile cell processing, quality systems, chain of custody). Prodigy automation reduces operator skill requirements to the level of existing blood bank technicians. Cloud connectivity enables real-time expert oversight without physical presence. The regulatory precedent exists: hospital blood banks are already FDA-registered cell processing facilities.',
        when_to_use_instead:
          'Pursue in parallel with primary concept. Blood bank network becomes the deployment model once integrated manufacturing (primary concept) is validated. Particularly valuable for patients who cannot tolerate 2-4 week wait or are geographically distant from centralized facilities.',
      },
      {
        id: 'sol-support-2',
        title: 'Stable Lentiviral Producer Lines + Continuous Perfusion',
        relationship: 'FALLBACK',
        one_liner:
          'Address the single largest cost driver (viral vectors at $50-100K/batch) through stable producer cell lines combined with continuous perfusion manufacturing',
        confidence: 65,
        what_it_is:
          'Stable producer lines (Oxgene TRiP system or similar) continuously produce lentiviral vectors without transient transfection. Suspension HEK293 culture in perfusion bioreactor maintains steady-state production. Continuous harvest and purification via inline chromatography. Vector is stockpiled and characterized, then released for CAR-T manufacturing on demand. This approach is less disruptive than non-viral transduction—it maintains current CAR-T manufacturing workflows while dramatically reducing the vector cost input.',
        why_it_works:
          'Stable producer lines eliminate the labor-intensive transient transfection step (large-scale plasmid production, transfection reagents, batch-to-batch variability). Continuous perfusion maintains cells at optimal density with steady-state vector production, improving facility utilization from ~20% (batch) to >80% (continuous). The safety concerns that drove abandonment of producer lines in the 1990s are addressed by modern vector designs (self-inactivating, split packaging) and improved RCL testing.',
        when_to_use_instead:
          'If non-viral transduction (primary concept) fails to achieve acceptable CAR+ percentages, or if regulatory pathway for Sleeping Beauty proves more complex than anticipated. Also appropriate for organizations with existing lentiviral manufacturing infrastructure seeking cost reduction without platform change.',
      },
      {
        id: 'sol-support-3',
        title: 'Real-Time Release Testing via Process Analytical Technology',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Eliminate the 14-day sterility hold that delays CAR-T release by implementing comprehensive Process Analytical Technology (PAT) enabling same-day parametric release',
        confidence: 60,
        what_it_is:
          'Replace end-of-process sterility testing with: continuous bioburden monitoring via impedance-based detection, inline endotoxin detection via recombinant Factor C assays, real-time PCR for mycoplasma (4 hours vs 28 days culture), closed system integrity monitoring (pressure decay testing, particle counting), and environmental monitoring with rapid microbial detection. If all in-process controls pass and closed system integrity is maintained, product is released parametrically without waiting for sterility culture results.',
        why_it_works:
          'All rapid detection methods are based on established physics. Impedance-based detection measures bacterial growth in real-time. Recombinant Factor C assays detect endotoxin without horseshoe crab lysate. Real-time PCR amplifies mycoplasma DNA in hours. Pressure decay testing confirms closed system integrity. The combination provides equivalent or better assurance than traditional methods. This approach is FDA-accepted for parenteral drugs and other biologics.',
        when_to_use_instead:
          'Pursue in parallel with primary concept. Time savings are valuable for patients with rapidly progressing disease. Particularly important when combined with hospital blood bank model to enable true same-day manufacturing and infusion.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Higher-risk explorations with breakthrough potential. Innovation concepts offer higher ceilings with higher uncertainty. These represent parallel bets on breakthrough outcomes that could fundamentally change the CAR-T manufacturing paradigm if successful.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'In Vivo CAR Generation via T-Cell-Targeted LNP-mRNA',
      confidence: 55,
      innovation_type: 'CROSS_DOMAIN',
      source_domain: 'COVID vaccine mRNA-LNP technology',
      the_insight: {
        what: 'CAR-T manufacturing can be eliminated entirely if we can deliver CAR-encoding genetic material directly to T-cells in the patient',
        where_we_found_it: {
          domain: 'mRNA vaccine technology',
          how_they_use_it:
            'Lipid nanoparticles deliver mRNA to cells in vivo, proven at billions of doses through COVID vaccines',
          why_it_transfers:
            'The same LNP technology can be surface-decorated with T-cell targeting ligands (anti-CD3 Fab, anti-CD7 nanobody, or CD5-binding peptide) to selectively transfect T-cells',
        },
        why_industry_missed_it:
          'COVID vaccines focused on muscle cell transfection. T-cell-targeted delivery requires additional targeting technology. The transient expression that seems like a limitation is actually a feature: it provides an inherent safety switch.',
      },
      what_it_is:
        'Eliminate ex vivo manufacturing entirely by injecting lipid nanoparticles loaded with CAR-encoding mRNA that selectively transfect T-cells in vivo. Manufacturing becomes LNP-mRNA production—scalable, inventoriable, and proven at billions of doses through COVID vaccines. The mechanism: Lipid nanoparticles are formulated with ionizable lipids optimized for endosomal escape and surface-decorated with T-cell targeting ligands. Upon IV injection, LNPs circulate, bind T-cells via targeting ligand, are internalized, and release CAR-encoding mRNA into cytoplasm. T-cells express functional CAR within 4-24 hours. Expression is transient (3-7 days per dose) but redosing is cheap ($500-2000 per injection). This is not theoretical—Rurik et al. (Science 2022) demonstrated functional CAR-T generation in mice using CD5-targeted LNPs. Capstan Therapeutics is pursuing clinical development with IND targeted for 2025.',
      why_it_works:
        'Ionizable lipids (pKa ~6.5) remain neutral at physiological pH but become cationic in acidic endosomes (pH 5-6), disrupting endosomal membrane and releasing mRNA cargo. Targeting ligands (anti-CD3, anti-CD5, anti-CD7) provide T-cell specificity through receptor-mediated endocytosis. Released mRNA is translated by ribosomal machinery, producing functional CAR protein that traffics to cell surface within 4-12 hours. The efficiency is sufficient: 10-40% of circulating T-cells can be transfected at appropriate doses, generating 10^8-10^9 CAR+ T-cells from the normal T-cell pool of 10^11.',
      breakthrough_potential: {
        if_it_works:
          'Complete elimination of ex vivo manufacturing. CAR-T becomes an injectable drug rather than a manufactured cell product. Same-day treatment becomes possible. Manufacturing scales like vaccines, not like cell therapy.',
        estimated_improvement:
          '100-1000x cost reduction (from $275K to $3-12K per treatment course). Uncertainty: ±50% on cost estimates; efficacy equivalence not yet proven in humans.',
        industry_impact:
          'Would fundamentally reshape the cell therapy industry. Manufacturing infrastructure becomes irrelevant. Competition shifts to LNP formulation and targeting technology.',
      },
      risks: {
        physics_risks: [
          'T-cell targeting specificity may be insufficient, causing off-target transfection',
          'Transient expression may not achieve durable responses in some tumor types',
          'Repeated dosing may trigger anti-LNP antibodies reducing efficacy',
        ],
        implementation_challenges: [
          'Clinical validation in humans not yet complete',
          'Dosing optimization for transient expression model',
        ],
        mitigation: [
          'Use highly specific targeting ligands; validate in human T-cell studies',
          'Plan for combination with checkpoint inhibitors if needed',
          'Explore modified lipid compositions to reduce immunogenicity',
        ],
      },
      validation_path: {
        gating_question:
          'Can in vivo LNP-mRNA CAR delivery achieve therapeutic T-cell responses in humans?',
        first_test:
          'Monitor Capstan Therapeutics Phase 1 trial results; validate targeting efficiency in human T-cells ex vivo',
        cost: 'Monitoring only; $10-20K for ex vivo validation studies',
        timeline: '12-18 months for Phase 1 data',
        go_no_go:
          'Phase 1 shows >10% T-cell transfection in humans AND evidence of anti-tumor activity → elevate to primary track',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title:
          'Haploidentical CAR-T Bank with Post-Transplant Cyclophosphamide',
        confidence: 50,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: 'Bone marrow transplant tolerance protocols',
        one_liner:
          'Create inventory of 50-100 haploidentical (half-matched) CAR-T products covering >95% of population, using post-infusion cyclophosphamide (PTCy) to eliminate alloreactive cells and enable persistence',
        the_insight: {
          what: 'Post-transplant cyclophosphamide selectively eliminates alloreactive cells while sparing quiescent CAR-T cells',
          where_we_found_it: {
            domain: 'Haploidentical bone marrow transplant protocols',
            how_they_use_it:
              'PTCy on days +3 and +4 after transplant eliminates rapidly-dividing alloreactive T-cells while sparing hematopoietic stem cells',
            why_it_transfers:
              'CAR-T cells that are not actively dividing (quiescent) should survive PTCy just like HSCs do',
          },
          why_industry_missed_it:
            'CAR-T and BMT communities are largely separate. PTCy is standard in BMT but not applied to CAR-T.',
        },
        ceiling:
          'True off-the-shelf product with autologous-like persistence. Manufacturing cost <$10K/dose at scale. Immediate availability.',
        key_uncertainty:
          'PTCy timing is critical—too early eliminates CAR-T cells, too late allows GvHD. The optimal window for CAR-T (vs. HSC) is not established. CAR-T cells may be more activated than HSCs, making them vulnerable to PTCy.',
        validation_approach: {
          test: 'Test PTCy timing in mouse haploidentical CAR-T model; measure CAR-T persistence and GvHD prevention',
          cost: '$75-100K for animal studies',
          timeline: '6-9 months',
          go_no_go:
            'Identify PTCy timing window with >30-day CAR-T persistence AND no GvHD → proceed to clinical protocol development',
        },
        when_to_elevate:
          'If in vivo LNP-mRNA (recommended innovation) fails to achieve durable responses, and autologous manufacturing cost reduction (primary solution) is insufficient for market access goals. Also elevate if BMT centers show interest in leading clinical development.',
      },
      {
        id: 'innov-parallel-2',
        title: 'Intratumoral Electroporation for In Situ TIL Arming',
        confidence: 40,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: 'Electrochemotherapy and gene electrotransfer',
        one_liner:
          'Deliver CAR-encoding DNA directly into tumor-infiltrating lymphocytes via intratumoral electroporation, arming TILs in situ without any ex vivo manufacturing',
        the_insight: {
          what: 'TILs are already tumor-localized and tumor-primed; adding CAR enhances their killing capacity',
          where_we_found_it: {
            domain: 'Electrochemotherapy clinical practice',
            how_they_use_it:
              'Electroporation delivers chemotherapy drugs directly into tumor cells for enhanced local killing',
            why_it_transfers:
              'Same electroporation physics can deliver DNA plasmids to TILs within the tumor',
          },
          why_industry_missed_it:
            'Electrochemotherapy community focused on drug delivery, not gene therapy. CAR-T community focused on ex vivo manufacturing. No intersection.',
        },
        ceiling:
          'Same-day treatment for accessible tumors. Manufacturing cost essentially zero—just plasmid production. Could reach tumors CAR-T cannot.',
        key_uncertainty:
          "TIL density varies enormously between tumors (10^6-10^8 per gram). 'Cold' tumors with low TIL infiltration won't respond. Patient selection is critical and may limit addressable population significantly.",
        validation_approach: {
          test: 'Inject Sleeping Beauty plasmid into mouse tumors with electroporation; measure CAR expression in TILs and tumor regression',
          cost: '$50-75K for animal studies',
          timeline: '4-6 months',
          go_no_go:
            '>5% TIL CAR expression AND measurable tumor regression → proceed. No TIL transfection OR no tumor effect → reject approach.',
        },
        when_to_elevate:
          'If solid tumor CAR-T continues to underperform in clinical trials, and accessible tumor sites are common in target indication. Particularly relevant for melanoma, head and neck cancer, and other superficial tumors with high TIL infiltration.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Trehalose-Based Ambient Temperature CAR-T Preservation',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Eliminate $10-20K logistics costs per patient and enable distribution to regions without cryogenic infrastructure',
        why_interesting:
          'Transformative for global access. The biology is proven—tardigrades survive complete desiccation for decades using trehalose.',
        why_not_now:
          "Mammalian cells don't naturally take up trehalose—loading requires membrane permeabilization which can damage cells. Viability recovery rates in T-cells not yet demonstrated at acceptable levels. Regulatory pathway for lyophilized cell therapy is undefined.",
        trigger_to_revisit:
          'Publication demonstrating >70% viability recovery of human T-cells after 4+ weeks room temperature storage; or FDA guidance on lyophilized cell therapy regulatory pathway',
        who_to_monitor:
          'Dr. John Crowe (UC Davis), Dr. Willem Wolkers (Hannover Medical School), Biomatik Corporation, Society for Cryobiology annual meeting',
        earliest_viability: '5-7 years',
        trl_estimate: 3,
        competitive_activity:
          'Limited. Academic groups exploring trehalose loading mechanisms. No commercial CAR-T preservation development known.',
      },
      {
        id: 'frontier-2',
        title:
          'Engineered Bacterial Symbiont for Continuous Bispecific Secretion',
        innovation_type: 'PARADIGM',
        one_liner:
          'Engineer tumor-colonizing bacteria to continuously secrete BiTE-like bispecific antibodies within the tumor microenvironment',
        why_interesting:
          "Completely decouples targeting (scalable bacterial manufacturing) from effector (patient's native T-cells). Manufacturing becomes bacterial fermentation—the cheapest biomanufacturing modality. Self-amplifying at tumor site means low doses needed.",
        why_not_now:
          "Bacterial safety in immunocompromised patients is a major concern—even attenuated strains can cause sepsis. Regulatory pathway for living bacterial therapeutics is complex. Colonization efficiency is variable. Cultural resistance to 'infecting' patients with bacteria.",
        trigger_to_revisit:
          'Phase 2 data showing acceptable safety profile for tumor-colonizing bacteria in immunocompromised patients; or demonstration of sustained BiTE secretion achieving tumor control in animal models',
        who_to_monitor:
          'BioMed Valley Discoveries (Clostridium novyi-NT), Synlogic, Dr. Neil Forbes (UMass), Dr. Jeff Bhardwaj (Memorial Sloan Kettering)',
        earliest_viability: '7-10 years',
        trl_estimate: 2,
        competitive_activity:
          'Early stage. BioMed Valley in Phase 1 with tumor-colonizing bacteria (not CAR-related). Synlogic focused on metabolic diseases.',
      },
      {
        id: 'frontier-3',
        title: 'Surface-Conjugated CAR via Click Chemistry',
        innovation_type: 'PARADIGM',
        one_liner:
          'Attach CAR proteins directly to T-cell surface via bioorthogonal click chemistry, eliminating genetic modification entirely',
        why_interesting:
          'If surface-attached CAR can signal effectively, this eliminates genetic modification entirely. Manufacturing becomes recombinant protein production—well-established, scalable, and cheap. Time from blood draw to CAR-T: potentially same day.',
        why_not_now:
          'Fundamental uncertainty about whether surface-attached CAR can signal effectively—CAR signaling depends on proper membrane orientation and clustering. Surface proteins turn over in 24-72 hours, requiring frequent redosing. The mechanism is unproven.',
        trigger_to_revisit:
          'Publication demonstrating functional CAR signaling from surface-conjugated (non-transmembrane) CAR proteins; or clinical data from any surface-modified cell therapy showing efficacy',
        who_to_monitor:
          'Dr. Darrell Irvine (MIT), Dr. Matthias Stephan (Fred Hutch), Click Chemistry Tools, Bioconjugate Chemistry journal',
        earliest_viability: '5-8 years',
        trl_estimate: 2,
        competitive_activity:
          'Academic only. Irvine and Stephan labs publishing on nanoparticle backpacks and surface modification. No commercial development.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Technical',
      risk: 'Sleeping Beauty transduction efficiency in Prodigy context may be significantly lower than standalone, requiring process re-optimization or acceptance of viral vectors',
      severity: 'high',
      mitigation:
        'First validation step specifically tests this. If efficiency is <10%, troubleshoot electroporation parameters. If still failing, CRISPR knock-in is alternative non-viral approach with higher efficiency.',
    },
    {
      category: 'Regulatory',
      risk: 'FDA may require more extensive bridging studies for combined novel elements (non-viral + minimal expansion + automation) than estimated, extending timeline by 12-24 months',
      severity: 'medium',
      mitigation:
        'Pre-IND meeting to align on bridging study design. Consider academic IND initially to generate data before commercial program. Each component has individual FDA acceptance.',
    },
    {
      category: 'Market',
      risk: 'Novartis T-Charge or competitor approaches may achieve similar cost reduction first, eliminating differentiation',
      severity: 'medium',
      mitigation:
        'T-Charge still uses lentivirus ($50-100K vector cost). Non-viral integration provides structural cost advantage. Speed to market matters—18-24 month timeline is competitive.',
    },
    {
      category: 'Technical',
      risk: 'In vivo expansion kinetics may be highly variable across patient populations, leading to unpredictable dosing and outcomes',
      severity: 'medium',
      mitigation:
        'T-Charge data provides baseline variability estimates. Patient selection criteria can exclude severe lymphopenia. IL-7/IL-15 dosing can be adjusted based on early expansion kinetics (day 7 CAR-T counts).',
    },
    {
      category: 'Resource',
      risk: 'Key personnel with expertise in both Sleeping Beauty and Prodigy systems are scarce; recruitment may be difficult',
      severity: 'low',
      mitigation:
        'Partner with academic centers (MD Anderson, U Minnesota) that have both capabilities. Miltenyi applications scientists can support Prodigy optimization. Training programs exist.',
    },
  ],

  self_critique: {
    confidence_level: 'medium',
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in individual component technologies (each validated), medium confidence in integration (untested combination), and uncertainty about regulatory pathway for combined novel elements.',
    what_we_might_be_wrong_about: [
      "Sleeping Beauty efficiency in Prodigy context—we're assuming it matches standalone, but electroporation parameters may need significant optimization",
      'In vivo expansion reliability—T-Charge data is from selected patients; real-world variability may be higher',
      'Regulatory timeline—FDA may be more conservative about combined novel elements than we estimate',
      'Hospital blood bank capability—the gap between blood bank processing and CAR-T manufacturing may be larger than we assume',
      'Cost estimates—hidden costs often emerge during scale-up; our $25-35K COGS may be optimistic',
    ],
    unexplored_directions: [
      'iPSC-derived CAR-T with tolerance engineering—we focused on autologous but iPSC solves the input quality problem entirely',
      "Continuous manufacturing for autologous CAR-T—we mentioned it but didn't develop a concept; may be feasible with proper segregation",
      'CAR-NK as alternative to CAR-T—different manufacturing constraints, may have different cost structure',
      'Combination with checkpoint inhibitors to enhance persistence of minimally-expanded cells',
    ],
    validation_gaps: [
      {
        concern:
          'Sleeping Beauty efficiency in Prodigy context may be lower than standalone',
        status: 'ADDRESSED',
        rationale:
          'First validation step specifically tests this with go/no-go criteria',
      },
      {
        concern: 'In vivo expansion reliability across patient populations',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Validation step tests healthy donors; should add patient-derived samples with exhausted phenotype to assess worst-case',
      },
      {
        concern: 'Regulatory timeline uncertainty',
        status: 'ACCEPTED_RISK',
        rationale:
          'Pre-IND meeting is recommended but timeline estimates remain uncertain until FDA feedback received',
      },
      {
        concern: 'Hospital blood bank capability gap',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Should add site assessment protocol to evaluate blood bank readiness before pilot commitment',
      },
      {
        concern: 'Cost estimate accuracy',
        status: 'ACCEPTED_RISK',
        rationale:
          'Detailed cost modeling requires actual process development; current estimates are based on component costs with reasonable assumptions',
      },
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd start with the validation experiment immediately—$50-75K to test Sleeping Beauty efficiency in Prodigy is cheap insurance before committing to the full program. While that's running, I'd have the pre-IND meeting conversation with FDA to understand their expectations for bridging studies. The regulatory pathway is the biggest unknown, and early alignment saves years.\n\nI'd pursue the hospital blood bank model in parallel, but I'd start with a single site partnership rather than building a network. Find one academic medical center with both a strong blood bank and CAR-T program (MD Anderson, Memorial Sloan Kettering, Fred Hutch), and run a pilot. The learnings from one site will inform whether network expansion makes sense.\n\nOn the innovation side, I'd keep a watching brief on Capstan's progress with in vivo LNP-mRNA. If their IND goes well, that's the future—but it's 5+ years out, so it doesn't change near-term strategy. The haploidentical PTCy approach is interesting but requires BMT expertise that most CAR-T developers don't have. I'd look for a partnership with a BMT-focused academic center rather than building that capability internally.\n\nThe thing I'd avoid is trying to do everything at once. The integrated manufacturing approach (primary concept) is the highest-probability path to the cost target. Get that working first, then layer on the blood bank network for distribution, then watch the in vivo approaches mature. Sequence matters—don't let the perfect be the enemy of the good.",

  follow_up_prompts: [
    'Create a detailed 18-month development plan for the integrated Prodigy + Sleeping Beauty manufacturing approach with milestones and decision gates',
    'Help me design the first validation experiment comparing Sleeping Beauty efficiency in Prodigy vs. standalone electroporation',
    'What should I ask FDA in the pre-IND meeting about bridging study requirements for combined novel elements?',
    'Draft a partnership proposal for MD Anderson or Memorial Sloan Kettering to pilot the hospital blood bank manufacturing model',
    'Compare the total cost of ownership for integrated rapid manufacturing vs. stable producer lines at 500 patients/year scale',
  ],
};
