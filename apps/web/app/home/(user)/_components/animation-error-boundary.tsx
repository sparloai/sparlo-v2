'use client';

import { Component, type ReactNode } from 'react';

interface AnimationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AnimationErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary specifically for animation components.
 * Falls back to static content if animations fail.
 *
 * Fixes P2-058: Missing error boundaries
 */
export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  constructor(props: AnimationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AnimationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log animation errors but don't crash the app
    console.error('Animation error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback or children without animation
      return this.props.fallback ?? this.props.children;
    }

    return this.props.children;
  }
}
