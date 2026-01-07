'use client';

import { useState, useCallback, useRef } from 'react';

import type {
  ReportId,
  SectionId,
  CardState,
  ShowcaseState,
} from './types';
import { ALL_SECTION_IDS } from './types';

const DEFAULT_SECTION: SectionId = 'executive-summary';
const ANIMATION_DURATION = 300; // ms - matches CSS transition

function createInitialCardStates(): Record<SectionId, CardState> {
  return Object.fromEntries(
    ALL_SECTION_IDS.map((id) => [
      id,
      id === DEFAULT_SECTION ? 'expanded' : 'collapsed',
    ]),
  ) as Record<SectionId, CardState>;
}

/**
 * State management hook for the Showcase Gallery
 *
 * Features:
 * - Accordion behavior: only one section expanded at a time
 * - Race condition protection: ignores clicks during animations
 * - Default section expanded on report switch
 */
export function useShowcaseState(initialReport: ReportId) {
  const [state, setState] = useState<ShowcaseState>({
    activeReportId: initialReport,
    expandedSectionId: DEFAULT_SECTION,
    cardStates: createInitialCardStates(),
    isModalOpen: false,
  });

  // Animation lock to prevent race conditions from rapid clicking
  const animatingRef = useRef<Set<SectionId>>(new Set());

  const expandSection = useCallback((sectionId: SectionId) => {
    // Block if this section is mid-animation
    if (animatingRef.current.has(sectionId)) return;

    setState((prev) => {
      const newCardStates = { ...prev.cardStates };
      let newExpandedSectionId: SectionId | null;

      // Collapse currently expanded section (if different)
      if (prev.expandedSectionId && prev.expandedSectionId !== sectionId) {
        newCardStates[prev.expandedSectionId] = 'collapsing';
        animatingRef.current.add(prev.expandedSectionId);
      }

      // Toggle or expand clicked section
      if (prev.expandedSectionId === sectionId) {
        // Clicking expanded section collapses it
        newCardStates[sectionId] = 'collapsing';
        newExpandedSectionId = null;
      } else {
        // Expand clicked section
        newCardStates[sectionId] = 'expanding';
        newExpandedSectionId = sectionId;
      }
      animatingRef.current.add(sectionId);

      // Clear animation state after duration
      const prevExpanded = prev.expandedSectionId;
      setTimeout(() => {
        animatingRef.current.delete(sectionId);
        if (prevExpanded && prevExpanded !== sectionId) {
          animatingRef.current.delete(prevExpanded);
        }
        setState((s) => ({
          ...s,
          cardStates: Object.fromEntries(
            Object.entries(s.cardStates).map(([id, cardState]) => [
              id,
              cardState === 'expanding'
                ? 'expanded'
                : cardState === 'collapsing'
                  ? 'collapsed'
                  : cardState,
            ]),
          ) as Record<SectionId, CardState>,
        }));
      }, ANIMATION_DURATION);

      return {
        ...prev,
        expandedSectionId: newExpandedSectionId,
        cardStates: newCardStates,
      };
    });
  }, []);

  const selectReport = useCallback((reportId: ReportId) => {
    setState((prev) => ({
      ...prev,
      activeReportId: reportId,
      expandedSectionId: DEFAULT_SECTION,
      cardStates: createInitialCardStates(),
    }));
    // Clear any pending animations
    animatingRef.current.clear();
  }, []);

  const openModal = useCallback(() => {
    setState((prev) => ({ ...prev, isModalOpen: true }));
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isModalOpen: false }));
  }, []);

  return {
    state,
    actions: { expandSection, selectReport, openModal, closeModal },
  };
}
